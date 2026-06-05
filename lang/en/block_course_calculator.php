<?php
// This file is part of Moodle - http://moodle.org/
//
// Moodle is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// Moodle is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with Moodle.  If not, see <http://www.gnu.org/licenses/>.

/**
 * Language strings.
 *
 * @package    block_course_calculator
 * @copyright  2024 onwards Toni Jokinen, University of Helsinki
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

$string['pluginname'] = 'Course Calculator';
$string['course_calculator:addinstance'] = 'Add a new Course Calculator block';
$string['course_calculator:myaddinstance'] = 'Add a new Course Calculator block to My home';

$string['config:calculatormode'] = 'Calculator mode';
$string['config:calculatormode_help'] = 'Choose whether this block instance shows a basic calculator or a scientific calculator.';
$string['mode:basic'] = 'Basic';
$string['mode:scientific'] = 'Scientific';

$string['inputlabel'] = 'Calculator input';
$string['historytitle'] = 'History';
$string['clearhistory'] = 'Clear';
$string['hintbasic'] = 'Basic mode supports arithmetic, brackets, decimal values, modulo and sign toggle.';
$string['hintscientific'] = 'Scientific mode adds powers, factorial, constants and common scientific functions.';
$string['privacy:metadata'] = 'The Course Calculator block does not store any personal data.';

$string['errorinvalidexpression'] = 'Invalid expression.';
$string['errordivisionbyzero'] = 'Division by zero is not allowed.';
$string['errorunknownfunction'] = 'Unknown function.';
$string['errorinvalidnumber'] = 'Invalid number.';
$string['errorarity'] = 'Wrong number of function arguments.';
$string['errorfactorial'] = 'Factorial is only available for non-negative integers.';
$string['errordomain'] = 'Value is outside the valid function range.';
$string['erroroverflow'] = 'Result is too large.';
