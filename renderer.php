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
 * Renderer for the Course Calculator block.
 *
 * @package    block_course_calculator
 * @copyright  2024 Toni Jokinen, University of Helsinki
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

defined('MOODLE_INTERNAL') || die();

/**
 * Renderer implementation.
 */
class block_course_calculator_renderer extends plugin_renderer_base {

    /**
     * Render calculator template.
     *
     * @param array $data template data
     * @return string
     */
    public function render_calculator(array $data): string {
        return $this->render_from_template('block_course_calculator/calculator', $data);
    }
}
