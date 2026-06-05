# Course Calculator block for Moodle

`block_course_calculator` is a Moodle block plugin that provides a calculator directly in the block region. It is useful on course pages and activity pages where learners need a calculator without leaving the current Moodle page.

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

Install the plugin using Moodle's standard plugin installation process:

1. Log in as an administrator.
2. Go to `Site administration > Plugins > Install plugins`.
3. Upload the plugin zip package.
4. Follow Moodle's installation and upgrade steps.

After installation, turn editing on and add the `Course Calculator` block to the required course or activity page.

If installing manually, place the plugin in `blocks/course_calculator` and visit site administration to complete the installation.

## Configuration

Each block instance can be configured separately.

- Calculator mode: `Basic` or `Scientific`

This allows one page to use a simple calculator while another uses the scientific layout.

The calculator always displays and copies decimal values with a dot separator, for example `1.1428571429`. This is intentional: Moodle quiz answer validation can depend on the active language pack, and dot decimals are the safest output format when answers may be pasted into quizzes using different interface languages. The calculator still accepts comma decimal input from the keyboard and pasted values.

## Recommended use

This plugin is intended for situations where the calculator needs to remain visible while the learner is working on another activity. For quiz usage, make sure your quiz layout is configured to show blocks during attempts.

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
vendor/bin/behat --config /path/to/behat.yml --profile=chrome blocks/course_calculator/tests/behat/calculator.feature
```

## Development notes

- The block is implemented with Moodle AMD JavaScript modules
- No external calculator libraries are required
- The calculator does not use JavaScript `eval`

## License

GPL v3 or later
