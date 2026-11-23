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

## Requirements

- Moodle 4.5 through 5.2

## Installation

Install the plugin using Moodle's standard plugin installation process:

1. Log in as an administrator.
2. Go to `Site administration > Plugins > Install plugins`.
3. Upload the plugin zip package.
4. Follow Moodle's installation and upgrade steps.

After installation, turn editing on and add the `Course Calculator` block to the required course or activity page.

## Configuration

Each block instance can be configured separately.

- Calculator mode: `Basic` or `Scientific`

This allows one page to use a simple calculator while another uses the scientific layout.

The calculator always displays and copies decimal values with a dot separator, for example `1.1428571429`. This is intentional: Moodle quiz answer validation can depend on the active language pack, and dot decimals are the safest output format when answers may be pasted into quizzes using different interface languages. The calculator still accepts comma decimal input from the keyboard and pasted values.

## Using the calculator in a quiz

To make the calculator available during a quiz attempt:

1. Turn editing on in the course and add the `Course Calculator` block to the quiz activity page. If the block is already there, check its page placement and visibility.
2. Open the quiz, select `More` (or the three-dot menu) > `Edit settings`.
3. Expand `Appearance` and set `Show blocks during quiz attempts` to `Yes`. Save the quiz settings.

Moodle hides blocks during quiz attempts when this setting is `No`, even if the calculator block is placed on the quiz page. When the quiz requires Safe Exam Browser (SEB), Moodle uses its secure page layout; this layout supports blocks, provided the quiz setting above is enabled. Check the quiz's SEB settings separately and make sure the SEB configuration permits access to your Moodle site.

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
- scientific functions and constants using calculator buttons
- block visibility on a quiz activity page
- history rendering
- editing grouped values with the keyboard
- small nonzero results and reuse of scientific notation
- negative operands, exponent precedence and numeric overflow
- teacher permissions and saving calculator mode through the block edit form
- dashboard placement and calculation during a student's quiz attempt
- assistive technology result announcements and input error association
- calculator text contrast against the active Moodle Boost theme

Example Behat command:

```bash
vendor/bin/behat --config /path/to/behat.yml --profile=chrome blocks/course_calculator/tests/behat/calculator.feature
```

## Development notes

- The block is implemented with Moodle ES modules compiled to AMD
- No external calculator libraries are required
- The calculator does not use JavaScript `eval`
- Calculations use JavaScript floating point numbers. Normal decimal results are
  rounded to ten decimal places; very small results retain eleven significant
  digits, and scientific notation is supported when reusing or pasting results.

## Changes in v1.0.7

- Fix pasted expression handling and add a visible power button in scientific mode.
- Preserve small nonzero answers, support exponent notation, and correct power,
  unary-minus, keyboard-entry, overflow and tangent edge cases.
- Announce results and errors to assistive technology, associate errors with the
  input, and use semantic lists and named control groups.
- Add Finnish translations, improve focus visibility and reduce-motion support,
  and increase contrast for muted and error text.
- Add Behat coverage for calculations, accessibility, Moodle page integration
  and the legacy calculator protection workflow.

## License

GPL v3 or later
