# Release Checklist

## Before packaging

- Confirm the plugin name, description and repository links are up to date
- Review `README.md`
- Increase `version.php`
- Confirm `release` in `version.php` matches the intended release label
- Make sure no temporary debug code or test-only changes remain

## Moodle checks

- Install cleanly on a fresh Moodle test site
- Upgrade cleanly from the previous plugin version
- Confirm the block can be added normally
- Confirm block instance configuration saves correctly
- Confirm both `Basic` and `Scientific` modes still work
- Confirm dot decimal output works and comma decimal input is still accepted

## Automated checks

- Run the Behat suite for this plugin
- Confirm all scenarios pass on the Moodle version you support

## Manual browser checks

- Test keyboard input in both modes
- Test mouse input in both modes
- Test `C`, `CE`, `DEL`, `%`, memory actions and history
- Test grouped number display and copy behaviour
- Test a quiz page where the block is visible during attempts

## Safe Exam Browser checks

- Open the real quiz in SEB
- Confirm the block is visible during the attempt
- Confirm focus can move safely between the calculator and answer fields
- Confirm copy and paste behaviour matches your institution's SEB policy
- Confirm nothing breaks on the actual exam workstation setup

## Packaging

- Package the plugin directory as `exam_calculator`
- Confirm the zip contains a single top-level plugin folder
- Keep `LICENSE`, `README.md` and test files in the package unless you intentionally exclude them

## After release

- Install the released zip on a clean verification site
- Re-run the most important smoke tests
- Tag or archive the exact released source state in Git
