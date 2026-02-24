# Workflow Patterns

## Sequential Workflows

For complex tasks, break operations into clear, sequential steps. It is often helpful to give Agent an overview of the process towards the beginning of SKILL.md:

```markdown
### Code review process

Review Progress:

- [ ] Step 1: Analyze code structure and organization
- [ ] Step 2: Check for potential bugs or edge cases
- [ ] Step 3: Suggest improvements for readability
- [ ] Step 4: Verify adherence to project conventions

**Step 1: Analyze code structure**
Review the overall organization...

**Step 2: Check for bugs**
Look for edge cases...

**Step 3: Suggest improvements for readability**
Review code for clarity...

**Step 4: Verify adherence to project conventions**
Check for compliance with project standards...
```

## Conditional Workflows

For tasks with branching logic, guide Agent through decision points:

```markdown
1. Determine the modification type:
   **Creating new content?** → Follow "Creation workflow" below
   **Editing existing content?** → Follow "Editing workflow" below

2. Creation workflow: [steps]
3. Editing workflow: [steps]
```

## Implement Feedback Loops

For quality-critical tasks, implement validation loops.

**Common pattern: Run validator → fix errors → repeat**

**Example : Content review** (using reference documents)

```markdown
### Document editing process

1. Make your edits to `word/document.xml`
2. **Validate immediately**: `python ooxml/scripts/validate.py unpacked_dir/`
3. If validation fails:
   - Review the error message carefully
   - Fix the issues in the XML
   - Run validation again
4. **Only proceed when validation passes**
5. Rebuild: `python ooxml/scripts/pack.py unpacked_dir/ output.docx`
6. Test the output document
```
