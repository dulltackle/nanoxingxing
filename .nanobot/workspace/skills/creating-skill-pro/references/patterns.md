# Patterns Examples

## Table of Contents

- [Pattern 1: Sequential Workflow Orchestration](#pattern-1-sequential-workflow-orchestration)
- [Pattern 2: Multi-MCP Coordination](#pattern-2-multi-mcp-coordination)
- [Pattern 3: Iterative Refinement](#pattern-3-iterative-refinement)
- [Pattern 4: Context-Aware Tool Selection](#pattern-4-context-aware-tool-selection)
- [Pattern 5: Domain-specific intelligence](#pattern-5-domain-specific-intelligence)

## Pattern 1: Sequential Workflow Orchestration

Use case: Your user needs to follow a multi-step process in a specific order.

Example: CI/CD Pipeline

```md
### Deployment Workflow

#### Step 1: Code Verification

- Run test suite
- Check code quality
- Verify dependencies

#### Step 2: Build Preparation

- Compile application
- Generate build artifacts
- Package assets

#### Step 3: Deployment

- Push to staging environment
- Run smoke tests
- Push to production environment

#### Step 4: Verification

- Run health checks
- Monitor error logs
- Rollback preparation
```

Key Techniques:

- Explicit sequence of steps
- Verification points at each step
- Rollback mechanisms
- Clear entry/exit criteria

## Pattern 2: Multi-MCP Coordination

Use case: Workflow spans multiple services.

Example: E-commerce Order Processing

```md
### Order Processing Workflow

#### Phase 1: Inventory Check (Inventory MCP)

- Check item availability
- Reserve stock quantity
- Estimate shipping date

#### Phase 2: Payment Processing (Payment MCP)

- Create payment intent
- Process payment gateway
- Verify payment status

#### Phase 3: Shipping (Shipping MCP)

- Generate shipping label
- Schedule pickup
- Provide tracking information

#### Phase 4: Notification (Email MCP)

- Send confirmation email
- Send shipping update
- Send delivery reminder
```

**Key Techniques:**

- Cross-service state management
- Error handling and retries
- Data transformation
- Inter-service coordination

## Pattern 3: Iterative Refinement

**Use case:** Output quality improves with iterations.
**Example: Documentation Generation**

```markdown
Documentation Creation Workflow

Iteration 1: Quick Draft

- Use MCP tool to fetch source code
- Generate basic document structure
- Capture main components

Iteration 2: Content Enhancement

- Add examples and usage
- Include parameter descriptions
- Add error handling

Iteration 3: Quality Improvement

- Check for consistency and clarity
- Format markdown
- Add cross-references

Iteration 4: Final Review

- Verify technical accuracy
- Check spelling and grammar
- Validate links
```

**Key Techniques:**

- Definition of iterative steps
- Improvement goals for each iteration
- Quality standards
- Decision on when to stop

## Pattern 4: Context-Aware Tool Selection

**Use case:** Selecting different tools based on context.
**Example: File Processing**

```markdown
File Processing Decision Tree

Case 1: Code Files (.py, .js, .ts, etc.)

- Use Code MCP for analysis
- Extract functions and classes
- Generate docstrings

Case 2: Data Files (.csv, .json, .xml, etc.)

- Use Data MCP for processing
- Perform transformations
- Generate reports

Case 3: Document Files (.md, .txt, .pdf, etc.)

- Use Text MCP for analysis
- Extract key information
- Generate summaries

Case 4: Image Files (.png, .jpg, .svg, etc.)

- Use Image MCP for processing
- Resize/Crop
- Convert format
```

**Key Techniques:**

- Clear decision criteria
- Fallback options
- Transparency about choices

## Pattern 5: Domain-specific intelligence

**Use case:** Your skill adds specialized knowledge beyond tool access.
**Example: Financial compliance**

```md
# Payment Processing with Compliance

## Before Processing (Compliance Check)

1. Fetch transaction details via MCP
2. Apply compliance rules:
   - Check sanctions lists
   - Verify jurisdiction allowances
   - Assess risk level
3. Document compliance decision

## Processing

IF compliance passed:

- Call payment processing MCP tool
- Apply appropriate fraud checks
- Process transaction

ELSE:

- Flag for review
- Create compliance case

## Audit Trail

- Log all compliance checks
- Record processing decisions
- Generate audit report
```

**Key Techniques:**

- Domain expertise embedded in logic
- Compliance before action
- Comprehensive documentation
- Clear governance
