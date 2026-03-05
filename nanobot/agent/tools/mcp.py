"""MCP client: connects to MCP servers and wraps their tools as native nanobot tools."""

import asyncio
from contextlib import AsyncExitStack
from typing import Any

import httpx
from loguru import logger

from nanobot.agent.tools.base import Tool
from nanobot.agent.tools.registry import ToolRegistry


class MCPToolWrapper(Tool):
    """Wraps a single MCP server tool as a nanobot Tool."""
    _CANCEL_CLEANUP_TIMEOUT_SECONDS = 2.0

    def __init__(self, session, server_name: str, tool_def, tool_timeout: int = 30):
        self._session = session
        self._original_name = tool_def.name
        self._name = f"mcp_{server_name}_{tool_def.name}"
        self._description = tool_def.description or tool_def.name
        self._parameters = tool_def.inputSchema or {"type": "object", "properties": {}}
        self._tool_timeout = tool_timeout

    @property
    def name(self) -> str:
        return self._name

    @property
    def description(self) -> str:
        return self._description

    @property
    def parameters(self) -> dict[str, Any]:
        return self._parameters

    async def _cleanup_call_task_blocking(
        self, call_task: asyncio.Task[Any], *, reason: str
    ) -> None:
        """Best-effort drain of a cancelled call task with a bounded wait."""
        if not call_task.done():
            done, _ = await asyncio.wait(
                {call_task}, timeout=self._CANCEL_CLEANUP_TIMEOUT_SECONDS
            )
            if not done:
                logger.warning(
                    "MCP tool '{}' cleanup timed out after {}s ({})",
                    self._name,
                    self._CANCEL_CLEANUP_TIMEOUT_SECONDS,
                    reason,
                )
                return

        try:
            await call_task
        except asyncio.CancelledError:
            # Expected when the task is cancelled (including anyio-backed cancellation).
            return
        except Exception as e:
            logger.debug(
                "MCP tool '{}' raised during cleanup ({}): {}",
                self._name,
                reason,
                e,
            )

    async def _cancel_and_cleanup_call_task_blocking(
        self, call_task: asyncio.Task[Any], *, reason: str
    ) -> None:
        """Cancel and synchronously drain the task (used by timeout path)."""
        if not call_task.done():
            call_task.cancel()
        await self._cleanup_call_task_blocking(call_task, reason=reason)

    def _cancel_and_cleanup_call_task_background(
        self, call_task: asyncio.Task[Any], *, reason: str
    ) -> None:
        """Cancel and detach cleanup so caller-cancelled paths avoid nested awaits."""
        if not call_task.done():
            call_task.cancel()

        cleanup_task = asyncio.create_task(
            self._cleanup_call_task_blocking(call_task, reason=reason)
        )

        def _consume_cleanup_result(task: asyncio.Task[Any]) -> None:
            try:
                task.result()
            except asyncio.CancelledError:
                # Event loop shutdown can cancel detached cleanup tasks.
                return
            except Exception as e:
                logger.debug(
                    "MCP tool '{}' background cleanup failed ({}): {}",
                    self._name,
                    reason,
                    e,
                )

        cleanup_task.add_done_callback(_consume_cleanup_result)

    async def execute(self, **kwargs: Any) -> str:
        from mcp import types
        call_task = asyncio.create_task(
            self._session.call_tool(self._original_name, arguments=kwargs)
        )
        try:
            done, _ = await asyncio.wait({call_task}, timeout=self._tool_timeout)
            if not done:
                logger.warning("MCP tool '{}' timed out after {}s", self._name, self._tool_timeout)
                await self._cancel_and_cleanup_call_task_blocking(call_task, reason="after timeout")
                return f"(MCP tool call timed out after {self._tool_timeout}s)"

            result = await call_task
        except asyncio.CancelledError:
            self._cancel_and_cleanup_call_task_background(
                call_task, reason="after caller cancellation"
            )
            logger.warning("MCP tool '{}' was cancelled before completion", self._name)
            return "(MCP tool call was cancelled)"
        parts = []
        for block in result.content:
            if isinstance(block, types.TextContent):
                parts.append(block.text)
            else:
                parts.append(str(block))
        return "\n".join(parts) or "(no output)"


async def connect_mcp_servers(
    mcp_servers: dict, registry: ToolRegistry, stack: AsyncExitStack
) -> None:
    """Connect to configured MCP servers and register their tools."""
    from mcp import ClientSession, StdioServerParameters
    from mcp.client.sse import sse_client
    from mcp.client.stdio import stdio_client
    from mcp.client.streamable_http import streamable_http_client

    for name, cfg in mcp_servers.items():
        try:
            transport_type = cfg.type
            if not transport_type:
                if cfg.command:
                    transport_type = "stdio"
                elif cfg.url:
                    # Convention: URLs ending with /sse use SSE transport; others use streamableHttp
                    transport_type = (
                        "sse" if cfg.url.rstrip("/").endswith("/sse") else "streamableHttp"
                    )
                else:
                    logger.warning("MCP server '{}': no command or url configured, skipping", name)
                    continue

            if transport_type == "stdio":
                params = StdioServerParameters(
                    command=cfg.command, args=cfg.args, env=cfg.env or None
                )
                read, write = await stack.enter_async_context(stdio_client(params))
            elif transport_type == "sse":
                def httpx_client_factory(
                    headers: dict[str, str] | None = None,
                    timeout: httpx.Timeout | None = None,
                    auth: httpx.Auth | None = None,
                ) -> httpx.AsyncClient:
                    merged_headers = {**(cfg.headers or {}), **(headers or {})}
                    return httpx.AsyncClient(
                        headers=merged_headers or None,
                        follow_redirects=True,
                        timeout=timeout,
                        auth=auth,
                    )

                read, write = await stack.enter_async_context(
                    sse_client(cfg.url, httpx_client_factory=httpx_client_factory)
                )
            elif transport_type == "streamableHttp":
                # Always provide an explicit httpx client so MCP HTTP transport does not
                # inherit httpx's default 5s timeout and preempt the higher-level tool timeout.
                http_client = await stack.enter_async_context(
                    httpx.AsyncClient(
                        headers=cfg.headers or None,
                        follow_redirects=True,
                        timeout=None,
                    )
                )
                read, write, _ = await stack.enter_async_context(
                    streamable_http_client(cfg.url, http_client=http_client)
                )
            else:
                logger.warning("MCP server '{}': unknown transport type '{}'", name, transport_type)
                continue

            session = await stack.enter_async_context(ClientSession(read, write))
            await session.initialize()

            tools = await session.list_tools()
            for tool_def in tools.tools:
                wrapper = MCPToolWrapper(session, name, tool_def, tool_timeout=cfg.tool_timeout)
                registry.register(wrapper)
                logger.debug("MCP: registered tool '{}' from server '{}'", wrapper.name, name)

            logger.info("MCP server '{}': connected, {} tools registered", name, len(tools.tools))
        except Exception as e:
            logger.error("MCP server '{}': failed to connect: {}", name, e)
