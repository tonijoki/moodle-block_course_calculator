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
 * Block definition for the Course Calculator.
 *
 * @package    block_course_calculator
 * @copyright  2024 onwards Toni Jokinen, University of Helsinki
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

defined('MOODLE_INTERNAL') || die();

/**
 * Course Calculator block.
 */
class block_course_calculator extends block_base {

    /**
     * Initialise block title.
     *
     * @return void
     */
    public function init() {
        $this->title = get_string('pluginname', 'block_course_calculator');
    }

    /**
     * This block has per-instance config.
     *
     * @return bool
     */
    public function instance_allow_config() {
        return true;
    }

    /**
     * Define applicable formats for the block.
     *
     * @return array
     */
    public function applicable_formats() {
        return [
            'all' => true,
            'site-index' => true,
            'my' => true,
        ];
    }

    /**
     * Build block content.
     *
     * @return stdClass
     */
    public function get_content() {
        global $PAGE;

        if ($this->content !== null) {
            return $this->content;
        }

        $this->content = new stdClass();
        $this->content->text = '';
        $this->content->footer = '';

        $mode = isset($this->config->calculatormode) ? $this->config->calculatormode : 'basic';
        if (!in_array($mode, ['basic', 'scientific'], true)) {
            $mode = 'basic';
        }

        $decimalseparator = '.';

        $instanceid = !empty($this->instance->id) ? (int)$this->instance->id : 0;
        $widgetid = 'block-course-calculator-' . $instanceid;

        $PAGE->requires->strings_for_js([
            'errorinvalidexpression',
            'errordivisionbyzero',
            'errorunknownfunction',
            'errorinvalidnumber',
            'errorarity',
            'errorfactorial',
            'errordomain',
            'erroroverflow',
        ], 'block_course_calculator');
        $PAGE->requires->js_call_amd(
            'block_course_calculator/calculator',
            'init',
            [[
                'elementid' => $widgetid,
                'mode' => $mode,
                'decimalseparator' => $decimalseparator,
            ]]
        );

        $renderer = $this->page->get_renderer('block_course_calculator');
        $this->content->text = $renderer->render_calculator([
            'elementid' => $widgetid,
            'isbasic' => $mode === 'basic',
            'isscientific' => $mode === 'scientific',
            'modebadge' => get_string('mode:' . $mode, 'block_course_calculator'),
            'decimalseparator' => $decimalseparator,
        ]);

        return $this->content;
    }
}
