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
 * Block instance edit form.
 *
 * @package    block_course_calculator
 * @copyright  2024 Toni Jokinen, University of Helsinki
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

defined('MOODLE_INTERNAL') || die();

require_once($CFG->dirroot . '/blocks/edit_form.php');

/**
 * Edit form for the Course Calculator block.
 */
class block_course_calculator_edit_form extends block_edit_form {
    /**
     * Define instance configuration form.
     *
     * @param MoodleQuickForm $mform form object
     * @return void
     */
    protected function specific_definition($mform) {
        $mform->addElement('header', 'configheader', get_string('blocksettings', 'block'));

        $options = [
            'basic' => get_string('mode:basic', 'block_course_calculator'),
            'scientific' => get_string('mode:scientific', 'block_course_calculator'),
        ];
        $mform->addElement(
            'select',
            'config_calculatormode',
            get_string('config:calculatormode', 'block_course_calculator'),
            $options
        );
        $mform->setDefault('config_calculatormode', 'basic');
        $mform->addHelpButton(
            'config_calculatormode',
            'config:calculatormode',
            'block_course_calculator'
        );
    }
}
