---
name: creating-skill-pro
description: Guide for creating effective skills. Use when users want to create a new skill (or update an existing skill) that extends Agent's capabilities with specialized knowledge, workflows, or tool integrations.
---

# Creating Skill

This skill provides guidance for creating effective skills.

## About Skills

Skills are modular, self-contained packages that extend Agent's capabilities by providing specialized knowledge, workflows, and tools. Think of them as "onboarding guides" for specific domains or tasks—they transform Agent from a general-purpose agent into a specialized agent equipped with procedural knowledge that no model can fully possess.

Skills Provide:

1. Specialized workflows - Multi-step procedures for specific domains
2. Tool integrations - Instructions for working with specific file formats or APIs
3. Domain expertise - Company-specific knowledge, schemas, business logic
4. Bundled resources - Scripts, references, and assets for complex and repetitive tasks

## Core Principles

### Concise is Key

- **Token is a shared resource**. The context window is a public good. Skills share the context window with everything else Agent needs: system prompt, conversation history, other Skills' metadata, and the actual user request.
- **Default assumption: Agent is already very smart.** Only add context Agent doesn't already have.
- **Challenge each piece of information.** "Does Agent really need this explanation?" and "Does this paragraph justify its token cost?"
- **Prefer concise examples over verbose explanations.**

### Set Appropriate Degrees of Freedom

Match the level of specificity to the task's fragility and variability:

- **High freedom (text-based instructions)**: Use when multiple approaches are valid, decisions depend on context, or heuristics guide the approach.
- **Medium freedom (pseudocode or scripts with parameters)**: Use when a preferred pattern exists, some variation is acceptable, or configuration affects behavior.
- **Low freedom (specific scripts, few parameters)**: Use when operations are fragile and error-prone, consistency is critical, or a specific sequence must be followed.

Think of Agent as exploring a path: a narrow bridge with cliffs needs specific guardrails (low freedom), while an open field allows many routes (high freedom).

### Anatomy of a Skill

Every skill consists of a required SKILL.md file and optional bundled resources:

```
skill-name/
├── SKILL.md (required)
│   ├── YAML frontmatter metadata (required)
│   │   ├── name: (required)
│   │   └── description: (required)
│   └── Markdown instructions (required)
└── Bundled Resources (optional)
    ├── scripts/          - Executable code (Python/Bash/etc.)
    ├── references/       - Documentation intended to be loaded into context as needed
    └── assets/           - Files used in output (templates, icons, fonts, etc.)
```

#### SKILL.md (required)

SKILL.md is an overview that points to detailed materials as needed. Every SKILL.md consists of:

- **Frontmatter** (YAML): Must include `name` and `description`. These are the only fields that Agent reads to determine when the skill gets used, thus it is very important to be clear and comprehensive in describing what the skill is, and when it should be used. (Other optional metadata fields may be present for tooling/packaging, but they are not used for triggering.)
  - **name** (required):
    - Use kebab-case only
    - No spaces or uppercase
    - Lowercase letters, digits, and hyphens only
    - Cannot start/end with `-` or contain consecutive hyphens (`--`)
    - Maximum 64 characters
    - Use gerund form (verb + `-ing`) for the first segment (e.g., `creating-pdf`)
    - Do not use reserved words/segments such as `anthropic` or `claude`
    - Should match the folder name
  - **description** (required):
    - Must include both:
      - What the skill does
      - When to use it (trigger conditions)
    - Under 1024 characters
    - No XML tags (< or >)
    - Include specific tasks the user might say
    - Mention file types if relevant
- **Body** (Markdown): Instructions and guidance for using the skill. Only loaded AFTER the skill triggers (if at all).
- **Keep SKILL.md under 500 lines**: split content into separate files when approaching this limit.

#### Bundled Resources (optional)

##### Scripts (`scripts/`)

Executable code (Python/Bash/etc.) for tasks that require deterministic reliability or are repeatedly rewritten.

- **When to include**: When the same code is being rewritten repeatedly or deterministic reliability is needed
- **Example**: `scripts/rotate_pdf.py` for PDF rotation tasks
- **Benefits**: Token efficient, deterministic, may be executed without loading into context
- **Note**: Scripts may still need to be read by Agent for patching or environment-specific adjustments
- **Precautions**:
  - Scripts solve problems rather than punt to Agent
  - Error handling is explicit and helpful
  - No "voodoo constants" (all values justified with self-documenting)
  - Required packages listed and verified as available
  - Scripts have clear documentation
  - No Windows-style paths (use forward slashes `/`)
  - Validation/verification steps for critical operations
  - Feedback loops included for quality-critical tasks
  - Use fully qualified MCP tool names to avoid "tool not found" errors.

##### References (`references/`)

Documentation and reference material intended to be loaded as needed into context to inform Agent's process and thinking.

- **When to include**: For documentation that Agent should reference while working
- **Examples**: `references/finance.md` for financial schemas, `references/mnda.md` for company NDA template, `references/policies.md` for company policies
- **Use cases**: Database schemas, API documentation, domain knowledge, company policies, detailed workflow guides
- **Benefits**: Keeps SKILL.md lean, loaded only when Agent determines it's needed
- **Best practice**: If files are large (>10k words), include grep search patterns in SKILL.md
- **Avoid duplication**: Information should live in either SKILL.md or references files, not both. Prefer references files for detailed information unless it's truly core to the skill—this keeps SKILL.md lean while making information discoverable without hogging the context window. Keep only essential procedural instructions and workflow guidance in SKILL.md; move detailed reference material, schemas, and examples to references files

##### Assets (`assets/`)

Files not intended to be loaded into context, but rather used within the output Agent produces.

- **When to include**: When the skill needs files that will be used in the final output
- **Examples**: `assets/logo.png` for brand assets, `assets/slides.pptx` for PowerPoint templates, `assets/frontend-template/` for HTML/React boilerplate
- **Use cases**: Templates, images, icons, boilerplate code, fonts, sample documents that get copied or modified
- **Benefits**: Separates output resources from documentation, enables Agent to use files without loading them into context

#### What to Not Include in a Skill

A skill should only contain essential files that directly support its functionality. Do NOT create extraneous documentation or auxiliary files, including:

- README.md
- INSTALLATION_GUIDE.md
- QUICK_REFERENCE.md
- CHANGELOG.md
- etc.

The skill should only contain the information needed for an AI agent to do the job at hand. It should not contain auxilary context about the process that went into creating it, setup and testing procedures, user-facing documentation, etc. Creating additional documentation files just adds clutter and confusion.

### Progressive Disclosure

#### Design Principle

Skills use a three-level loading system to manage context efficiently:

1. **Metadata (name + description)** - Always in context (~100 words)
2. **SKILL.md body** - When skill triggers (<5k words)
3. **Bundled resources** - As needed by Agent (Unlimited because scripts can be executed without reading into context window)

#### The `description` Field

`description` provides enough signal for agent to know when it should use each skill, without needing to load everything into context."

**Structure**: [What it does] + [When to use] + [Key capabilities]

##### **Good Description Examples**:

- Good - Specific and Actionable
  - description: Analyzes Figma design files and generates developer handoff documentation. Use when user uploads .fig files, asks for "design specs", "component documentation", or "design-to-code handoff".
- Good - Includes Trigger Phrases
  - description: Manages Linear project workflows including sprint planning, task creation, and status tracking. Use when user mentions "sprint", "Linear tasks", "project planning", or asks to "create tickets".

##### **Bad Description Examples**:

- Too Vague
  - description: Helps with projects.
- Missing Trigger Words
  - description: Creates sophisticated multi-page documentation systems.
- Too Technical, No User Triggers
  - description: Implements the Project entity model with hierarchical relationships.

#### The recommended `body` Field

```md
# Your Skill Name

## Instructions

### Step 1: [First Major Step]

Clear explanation of what happens.
Example:
python scripts/fetch_data.py --project-id PROJECT_ID
Expected output: [describe what success looks like]
(Add more steps as needed)

## Examples

Example 1: [common scenario]
User says: "Set up a new marketing campaign"
Actions:
Fetch existing campaigns via MCP
Create new campaign with provided parameters
Result: Campaign created with confirmation link
(Add more examples as needed)

## Troubleshooting

Error: [Common error message]
Cause: [Why it happens]
Solution: [How to fix]

(Add more error cases as needed)
```

See references/example.md for a complete skill example

### Patterns

Keep SKILL.md body to the essentials and under 500 lines to minimize context bloat. Split content into separate files when approaching this limit. When splitting out content into other files, it is very important to reference them from SKILL.md and describe clearly when to read them, to ensure the reader of the skill knows they exist and when to use them.

**Key principle:** When a skill supports multiple variations, frameworks, or options, keep only the core workflow and selection guidance in SKILL.md. Move variant-specific details (patterns, examples, configuration) into separate reference files.

See references/patterns.md for a complete pattern example

## Skill Creation Process

Skill creation involves these steps:

1. Understand the skill with concrete examples
2. Plan reusable skill contents (scripts, references, assets)
3. Initialize the skill (run ./scripts/init_skill.py)
4. Edit the skill (write SKILL.md and implement resources as needed)
5. Final Check (verify against quality checklist)
6. Validate the skill (run ./scripts/quick_validate.py)
7. Packaging the Skill if user requests it (run ./scripts/package_skill.py)
8. Iterate based on real usage

Follow these steps in order, skipping only if there is a clear reason why they are not applicable.

### Step 1: Understanding the Skill with Concrete Examples

Skip this step only when the skill's usage patterns are already clearly understood. It remains valuable even when working with an existing skill.

To create an effective skill, clearly understand concrete examples of how and when the skill will be used. This understanding can come from either direct user examples or generated examples that are validated with user feedback.

For example, when building an image-editor skill, relevant questions include:

- "What functionality should the image-editor skill support? Editing, rotating, anything else?"
- "Can you give some examples of how this skill would be used?"
- "I can imagine users asking for things like 'Remove the red-eye from this image' or 'Rotate this image'. Are there other ways you imagine this skill being used?"
- "What would a user say that should trigger this skill?"

To avoid overwhelming users, avoid asking too many questions in a single message. Start with the most important questions and follow up as needed for better effectiveness.

Conclude this step when there is a clear sense of the functionality the skill should support.

### Step 2: Planning the Reusable Skill Contents

To turn concrete examples into an effective skill, analyze each example by:

1. Considering how to execute on the example from scratch
2. Identifying what scripts, references, and assets would be helpful when executing these workflows repeatedly

Example: When building a `editing-pdf` skill to handle queries like "Help me rotate this PDF," the analysis shows:

1. Rotating a PDF requires re-writing the same code each time
2. A `scripts/rotate_pdf.py` script would be helpful to store in the skill

Example: When designing a `building-frontend-webapp` skill for queries like "Build me a todo app" or "Build me a dashboard to track my steps," the analysis shows:

1. Writing a frontend webapp requires the same boilerplate HTML/React each time
2. An `assets/hello-world/` template containing the boilerplate HTML/React project files would be helpful to store in the skill

Example: When building a `big-query` skill to handle queries like "How many users have logged in today?" the analysis shows:

1. Querying BigQuery requires re-discovering the table schemas and relationships each time
2. A `references/schema.md` file documenting the table schemas would be helpful to store in the skill

To establish the skill's contents, analyze each concrete example to create a list of the reusable resources to include: scripts, references, and assets.

- Avoid deeply nested references - Keep references one level deep from SKILL.md. All reference files should link directly from SKILL.md.
- Structure longer reference files - For reference files longer than 100 lines, include a table of contents at the top so Agent can see the full scope when previewing.

### Step 3: Initializing the Skill

At this point, it is time to actually create the skill.

Skip this step only if the skill being developed already exists, and iteration or packaging is needed. In this case, continue to the next step.

When creating a new skill from scratch, always run the `init_skill.py` script. The script conveniently generates a new template skill directory that automatically includes everything a skill requires, making the skill creation process much more efficient and reliable.

Usage:

```bash
python3 ./scripts/init_skill.py <skill-name> --path <skill-path>
```

The script:

- Creates the skill directory at the specified path
- Generates a SKILL.md template with proper frontmatter and TODO placeholders
- Creates example resource directories: `scripts/`, `references/`, and `assets/`
- Adds example files in each directory that can be customized or deleted

After initialization, customize or remove the generated SKILL.md and example files as needed.

### Step 4: Edit the Skill

When reading the SKILL.md template and editing the (newly-generated or existing) skill, remember that the skill is being created for another instance of Agent to use. Include information that would be beneficial and non-obvious to Agent. Consider what procedural knowledge, domain-specific details, or reusable assets would help another Agent instance execute these tasks more effectively.

#### Learn Proven Design Patterns

Consult these helpful guides based on your skill's needs:

- **Multi-step processes**: See references/workflows.md for sequential workflows and conditional logic
- **Specific output formats or quality standards**: See references/output-patterns.md for template and example patterns

These files contain established best practices for effective skill design.

#### Start with Reusable Skill Contents

To begin implementation, start with the reusable resources identified above: `scripts/`, `references/`, and `assets/` files. Note that this step may require user input. For example, when implementing a `brand-guidelines` skill, the user may need to provide brand assets or templates to store in `assets/`, or documentation to store in `references/`.

Added scripts must be tested by actually running them to ensure there are no bugs and that the output matches what is expected. If there are many similar scripts, only a representative sample needs to be tested to ensure confidence that they all work while balancing time to completion.

Any example files and directories not needed for the skill should be deleted. The initialization script creates example files in `scripts/`, `references/`, and `assets/` to demonstrate structure, but most skills won't need all of them.

#### Update SKILL.md

**Writing Guidelines:** Always use imperative/infinitive form.

##### Frontmatter

Write the YAML frontmatter with required `name` and `description`:

- `name`: The skill name
- `description`: This is the primary triggering mechanism for your skill, and helps Agent understand when to use the skill.
  - Include both what the Skill does and specific triggers/contexts for when to use it.
  - Include all "when to use" information here - Not in the body. The body is only loaded after triggering, so "When to Use This Skill" sections in the body are not helpful to Agent.
  - Example description for a `docx` skill: "Comprehensive document creation, editing, and analysis with support for tracked changes, comments, formatting preservation, and text extraction. Use when Agent needs to work with professional documents (.docx files) for: (1) Creating new documents, (2) Modifying or editing content, (3) Working with tracked changes, (4) Adding comments, or any other document tasks"

Optional frontmatter fields may be included when needed for tooling compatibility: `metadata`, `license`, and `allowed-tools`.

Do not include any other frontmatter fields beyond: `name`, `description`, `metadata`, `license`, and `allowed-tools`.

##### Body

Write instructions for using the skill and its bundled resources.

##### Use Consistent Terminology

Choose one term and use it throughout the Skill.

**Good - Consistent:**

- Always "API endpoint"
- Always "field"
- Always "extract"

**Bad - Inconsistent:**

- Mix "API endpoint", "URL", "API route", "path"
- Mix "field", "box", "element", "control"
- Mix "extract", "pull", "get", "retrieve"

### Step 5: Final Check

Before finalizing Skill, verify:

#### Core Quality

- [ ] Description is specific and includes key terms
- [ ] Description includes both what Skill does AND when to use it
- [ ] SKILL.md body is under 500 lines
- [ ] Additional details in separate files (if needed)
- [ ] No time-sensitive information (or in "old patterns" section)
- [ ] Consistent terminology throughout
- [ ] Examples are concrete, not abstract
- [ ] File references are one level deep
- [ ] Progressive disclosure used appropriately
- [ ] Workflows have clear steps (if applicable)

#### Anti-Patterns to Avoid

| Avoid                             | Instead                                       |
| --------------------------------- | --------------------------------------------- |
| Windows paths (`scripts\file.py`) | Unix paths (`scripts/file.py`)                |
| Too many options                  | Provide default + escape hatch                |
| "I can help you..."               | Third person: "Processes..."                  |
| "Helps with documents"            | Specific: "Extracts data from Excel files..." |
| Deep nesting (A → B → C)          | One level deep (A → B, A → C)                 |
| Explaining basics Agent knows     | Assume knowledge, be concise                  |
| Magic numbers (TIMEOUT=47)        | Documented values with reasons                |
| Assuming tools installed          | Explicit: `pip install package`               |

### Step 6: Validate the skill

Once development of the skill is complete, it must be validated to ensure it meets all requirements. The validation process checks:

```bash
python3 scripts/quick_validate.py <path/to/skill-folder>
```

- YAML frontmatter format and allowed/required top-level fields
- Skill naming conventions and directory-name match
- Description format constraints (string type, no angle brackets, max 1024 chars)
- Basic schema/syntax checks for quick validation before deeper manual review

Ensure all validation checks pass before proceeding.
Note: `quick_validate.py` is a quick validator. It does not judge body quality, verify resource usefulness, or confirm `references/` are cited correctly.

### Step 7: Packaging the skill if user requests

Ask user if a distributable .skill file is required.
If yes, use the packaging script. This script automatically validates the skill before packaging:

```bash
python3 scripts/package_skill.py <path/to/skill-folder>
```

Optional output directory specification:

```bash
python3 scripts/package_skill.py <path/to/skill-folder> ./dist
```

The packaging script will:

1. **Validate** the skill automatically.
2. **Package** the skill if validation passes, creating a .skill file named after the skill (e.g., `my-skill.skill`) that includes all files and maintains the proper directory structure for distribution. The .skill file is a zip file with a .skill extension.

If validation fails, the script will report the errors and exit without creating a package. Fix any validation errors and run the packaging command again.

### Step 8: Iterate

After testing the skill, users may request improvements. Often this happens right after using the skill, with fresh context of how the skill performed.

**Iteration workflow:**

1. Use the skill on real tasks
2. Notice struggles or inefficiencies
3. Identify how SKILL.md or bundled resources should be updated
4. Implement changes and test again
