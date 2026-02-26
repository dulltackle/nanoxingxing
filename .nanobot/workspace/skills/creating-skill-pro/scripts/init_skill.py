#!/usr/bin/env python3
"""
Skill Initializer - Creates a new skill from template

Usage:
    init_skill.py <skill-name> --path <skills_folder_path>

Examples:
    init_skill.py analyzing-spreadsheets --path .claude/skills
"""

import sys
from pathlib import Path


SKILL_TEMPLATE = """---
name: {skill_name}
description: "TODO: Replace with a specific description of what this skill does and when to use it."
---

# {skill_title}

## Overview

[TODO: 1-2 sentences describing the capability this skill adds.]

## Instructions

### Step 1: Understand the request
[TODO: List what to inspect, ask, or verify before acting.]

### Step 2: Execute the core workflow
[TODO: Add the main workflow. Prefer explicit steps for fragile tasks.]

### Step 3: Validate the result
[TODO: Add checks/tests/verification steps.]

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

## Resources

### scripts/
Executable code (Python/Bash/etc.) that can be run directly to perform specific operations.

**Examples from other skills:**
- PDF skill: `fill_fillable_fields.py`, `extract_form_field_info.py` - utilities for PDF manipulation

**Appropriate for:** Python scripts, shell scripts, or any executable code that performs automation, data processing, or specific operations.

**Note:** Scripts may be executed without loading into context, but can still be read by Agent for patching or environment adjustments.

### references/
Documentation and reference material intended to be loaded into context to inform Agent's process and thinking.

**Examples from other skills:**
- Product management: `communication.md`, `context_building.md`
- detailed workflow guides

**Appropriate for:** In-depth documentation, API references, database schemas, comprehensive guides, or any detailed information that Agent should reference while working.

### assets/
Files not intended to be loaded into context, but rather used within the output Agent produces.

**Examples from other skills:** Brand styling: PowerPoint template files (.pptx), logo files

**Appropriate for:** Templates, boilerplate code, document templates, images, icons, fonts, or any files meant to be copied or used in the final output.

---

**Any unneeded directories can be deleted.** Not every skill requires all three types of resources.
"""

EXAMPLE_SCRIPT = '''#!/usr/bin/env python3
"""
Placeholder script for {skill_name}

Replace with real logic or delete this file if no script is needed.
"""

def main():
    print("This is an example script for {skill_name}")
    # TODO: Add actual script logic here
    # This could be data processing, file conversion, API calls, etc.

if __name__ == "__main__":
    main()
'''

EXAMPLE_REFERENCE = """# {skill_title} Reference

Replace with task-specific reference material or delete this file.

Suggested uses:
- API endpoints / schemas
- Command cheatsheets
- Decision tables
- Detailed workflow notes
"""

EXAMPLE_ASSET = """# Example Asset File

Replace with a real asset (template/image/font/etc.) or delete this file.
"""


def title_case_skill_name(skill_name):
    """Convert hyphenated skill name to Title Case for display."""
    return ' '.join(word.capitalize() for word in skill_name.split('-'))


def init_skill(skill_name, path):
    """
    Initialize a new skill directory with template SKILL.md.

    Args:
        skill_name: Name of the skill
        path: Path where the skill directory should be created

    Returns:
        Path to created skill directory, or None if error
    """
    # Determine skill directory path
    skill_dir = Path(path).resolve() / skill_name

    # Check if directory already exists
    if skill_dir.exists():
        print(f"❌ Error: Skill directory already exists: {skill_dir}")
        return None

    # Create skill directory
    try:
        skill_dir.mkdir(parents=True, exist_ok=False)
        print(f"✅ Created skill directory: {skill_dir}")
    except Exception as e:
        print(f"❌ Error creating directory: {e}")
        return None

    # Create SKILL.md from template
    skill_title = title_case_skill_name(skill_name)
    skill_content = SKILL_TEMPLATE.format(
        skill_name=skill_name,
        skill_title=skill_title
    )

    skill_md_path = skill_dir / 'SKILL.md'
    try:
        skill_md_path.write_text(skill_content)
        print("✅ Created SKILL.md")
    except Exception as e:
        print(f"❌ Error creating SKILL.md: {e}")
        return None

    # Create resource directories with example files
    try:
        # Create scripts/ directory with example script
        scripts_dir = skill_dir / 'scripts'
        scripts_dir.mkdir(exist_ok=True)
        example_script = scripts_dir / 'example.py'
        example_script.write_text(EXAMPLE_SCRIPT.format(skill_name=skill_name))
        example_script.chmod(0o755)
        print("✅ Created scripts/example.py")

        # Create references/ directory with example reference doc
        references_dir = skill_dir / 'references'
        references_dir.mkdir(exist_ok=True)
        example_reference = references_dir / 'api_reference.md'
        example_reference.write_text(EXAMPLE_REFERENCE.format(skill_title=skill_title))
        print("✅ Created references/api_reference.md")

        # Create assets/ directory with example asset placeholder
        assets_dir = skill_dir / 'assets'
        assets_dir.mkdir(exist_ok=True)
        example_asset = assets_dir / 'example_asset.txt'
        example_asset.write_text(EXAMPLE_ASSET)
        print("✅ Created assets/example_asset.txt")
    except Exception as e:
        print(f"❌ Error creating resource directories: {e}")
        return None

    # Print next steps
    print(f"\n✅ Skill '{skill_name}' initialized successfully at {skill_dir}")
    print("\nNext steps:")
    print("1. Edit SKILL.md to complete the TODO items and update the description")
    print("2. Customize or delete the example files in scripts/, references/, and assets/")
    print("3. Run the validator when ready to check the skill structure")

    return skill_dir


def main():
    if len(sys.argv) < 4 or sys.argv[2] != '--path':
        print("Usage: python3 ./scripts/init_skill.py <skill-name> --path <skill-folder-path>")
        print("\nSkill name requirements:")
        print("  - Hyphen-case identifier (e.g., 'creating-pdf')")
        print("  - Lowercase letters, digits, and hyphens only")
        print("  - Max 64 characters")
        print("  - Use gerund form (verb + -ing)")
        print("  - No reserved words: 'anthropic', 'claude'")
        print("  - Avoid vague names: 'helper', 'utils', 'tools'")
        print("  - Avoid overly generic: 'documents', 'data', 'files'")
        print("  - Avoid reserved words: 'anthropic-helper', 'claude-tools'")
        print("  - Must match directory name exactly")
        print("\nExamples:")
        print("  python3 ./scripts/init_skill.py creating-pdf --path .claude/skills")
        sys.exit(1)

    skill_name = sys.argv[1]
    path = sys.argv[3]

    print(f"🚀 Initializing skill: {skill_name}")
    print(f"   Location: {path}/{skill_name}")
    print()

    result = init_skill(skill_name, path)

    if result:
        sys.exit(0)
    else:
        sys.exit(1)


if __name__ == "__main__":
    main()
