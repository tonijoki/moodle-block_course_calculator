# Exam Calculator block for Moodle

`block_exam_calculator` is a Moodle block plugin that provides a calculator directly in the block region. It is designed especially for quiz layouts where the calculator must stay visible in the side column, including Safe Exam Browser oriented use cases.

## Features

- Per-block mode selection: `Basic` or `Scientific`
- Keyboard and mouse input
- Windows Calculator inspired behaviour in `Basic` mode
- Scientific functions such as powers, square root, factorial, trigonometry, logarithms and constants
- Five-row calculation history
- Memory actions: `MC`, `MR`, `M+`, `M-`
- Readable grouped number display for large values
- Copying from the display preserves a plain numeric value without visual grouping spaces
- Dot decimal output for Moodle quiz answer compatibility

## Installation

1. Copy the plugin into `blocks/exam_calculator`
2. Visit Moodle site administration to complete the installation
3. Add the block to the required page, course or quiz layout
4. Open the block configuration and choose the calculator mode

## Configuration

Each block instance can be configured separately.

- Calculator mode: `Basic` or `Scientific`

This allows one page to use a simple calculator while another uses the scientific layout.

The calculator always displays and copies decimal values with a dot separator, for example `1.1428571429`. This is intentional: Moodle quiz answer validation can depend on the active language pack, and dot decimals are the safest output format when answers may be pasted into quizzes using different interface languages. The calculator still accepts comma decimal input from the keyboard and pasted values.

## Recommended use

This plugin is intended for situations where the calculator needs to remain visible while the learner is working on another activity, especially quizzes. For quiz usage, make sure your quiz layout is configured to show blocks during attempts.

## Automated testing

The plugin includes Behat acceptance tests covering the main user flows in both calculator modes.

Current automated coverage includes:

- basic calculations
- grouped number display
- dot decimal output
- `C`, `CE` and `DEL`
- percentage calculations
- memory actions
- scientific square root
- block visibility on a quiz activity page
- history rendering

Example Behat command:

```bash
vendor/bin/behat --config /path/to/behat.yml --profile=chrome blocks/exam_calculator/tests/behat/calculator.feature
```

## Manual testing still recommended

Automated tests are a strong regression safety net, but they do not replace manual validation in a real Safe Exam Browser environment.

Recommended manual checks:

- quiz attempt page layout with blocks visible
- keyboard focus changes between answer fields and calculator
- copy and paste behaviour inside your actual SEB configuration
- behaviour on the real exam machines and browser stack used by your institution

## Development notes

- The block is implemented with Moodle AMD JavaScript modules
- No external calculator libraries are required
- The calculator does not use JavaScript `eval`
- Increase `version.php` on every change that should be detected by Moodle upgrades

## License

GPL v3 or later
