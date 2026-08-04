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
 * Calculator interaction and expression evaluation.
 *
 * @module     block_course_calculator/calculator
 * @copyright  2024 Toni Jokinen, University of Helsinki
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

import {getStrings} from 'core/str';

const MAX_HISTORY_ITEMS = 5;
const PRECEDENCE = {"+": 1, "-": 1, "*": 2, "/": 2, "%": 2, "^": 3, "NEG": 4, "!": 5};
const RIGHT_ASSOCIATIVE = {"^": true, "NEG": true};
const SUPPORTED_FUNCTIONS = {
    sin: {min: 1, max: 1},
    cos: {min: 1, max: 1},
    tan: {min: 1, max: 1},
    asin: {min: 1, max: 1},
    acos: {min: 1, max: 1},
    atan: {min: 1, max: 1},
    sqrt: {min: 1, max: 1},
    abs: {min: 1, max: 1},
    ln: {min: 1, max: 1},
    log: {min: 1, max: 1},
    exp: {min: 1, max: 1},
    pow: {min: 2, max: 2},
    min: {min: 1, max: Infinity},
    max: {min: 1, max: Infinity},
    round: {min: 1, max: 1},
    floor: {min: 1, max: 1},
    ceil: {min: 1, max: 1},
};
const messages = {};

const loadStrings = async() => {
    const names = [
        "errorinvalidexpression",
        "errordivisionbyzero",
        "errorunknownfunction",
        "errorinvalidnumber",
        "errorarity",
        "errorfactorial",
        "errordomain",
        "erroroverflow",
    ];
    const values = await getStrings(names.map((key) => ({key: key, component: "block_course_calculator"})));
    names.forEach((key, index) => {
        messages[key] = values[index];
    });
};

const isDigit = (char) => char >= "0" && char <= "9";
const isAlpha = (char) => /[a-z_]/i.test(char);
const isEntryCharacter = (value) => /^[0-9.,]$/.test(value) || ["pi", "e", "("].includes(value);
const isOperatorCharacter = (value) => ["+", "-", "*", "/", "^"].includes(value);
const createLocale = (decimalseparator) => ({
    decimalSeparator: decimalseparator === "." ? "." : ",",
    groupSeparator: decimalseparator === "." ? "," : " ",
});
const normalizeInput = (expression) => expression.replace(/\s+/g, "");
const canonicalNumberString = (text) => {
    const value = String(text || "").trim().replace(/\s+/g, "");
    if (!value) {
        return "0";
    }

    let sign = "";
    let body = value;
    if (body.startsWith("-")) {
        sign = "-";
        body = body.substring(1);
    }

    const lastdot = body.lastIndexOf(".");
    const lastcomma = body.lastIndexOf(",");
    let decimalindex = -1;

    if (lastdot !== -1 && lastcomma !== -1) {
        decimalindex = Math.max(lastdot, lastcomma);
    } else if (lastdot !== -1) {
        decimalindex = lastdot;
    } else if (lastcomma !== -1) {
        decimalindex = lastcomma;
    }

    let integerpart = body;
    let fractionpart = "";
    if (decimalindex !== -1) {
        integerpart = body.substring(0, decimalindex);
        fractionpart = body.substring(decimalindex + 1);
    }

    integerpart = integerpart.replace(/[.,]/g, "").replace(/\D/g, "");
    fractionpart = fractionpart.replace(/[.,]/g, "").replace(/\D/g, "");

    if (integerpart === "") {
        integerpart = "0";
    }

    return sign + integerpart + (decimalindex !== -1 ? "." + fractionpart : "");
};
const addGrouping = (integerpart, separator) => integerpart.replace(/\B(?=(\d{3})+(?!\d))/g, separator);
const localizeCanonicalNumber = (text, locale, usegrouping) => {
    let value = String(text || "0");
    let sign = "";
    if (value.startsWith("-")) {
        sign = "-";
        value = value.substring(1);
    }

    const hassuffixdecimal = value.endsWith(".");
    const parts = value.split(".");
    let integerpart = parts[0] || "0";
    const fractionpart = parts.length > 1 ? parts.slice(1).join("") : "";

    if (usegrouping) {
        integerpart = addGrouping(integerpart, locale.groupSeparator);
    }

    let output = sign + integerpart;
    if (fractionpart !== "") {
        output += locale.decimalSeparator + fractionpart;
    } else if (hassuffixdecimal) {
        output += locale.decimalSeparator;
    }

    return output;
};
const formatExpressionForDisplay = (expression, locale) => {
    const source = String(expression || "");
    let output = "";
    let index = 0;

    while (index < source.length) {
        const char = source[index];
        const next = source[index + 1] || "";

        if (isDigit(char) || ((char === "." || char === ",") && isDigit(next))) {
            let token = char;
            let end = index + 1;
            let seenDecimal = char === "." || char === ",";

            while (end < source.length) {
                const current = source[end];
                const after = source[end + 1] || "";
                if (isDigit(current)) {
                    token += current;
                    end += 1;
                    continue;
                }
                if ((current === "." || current === ",") && !seenDecimal && isDigit(after)) {
                    token += current;
                    seenDecimal = true;
                    end += 1;
                    continue;
                }
                if ((current === "." || current === ",") && !seenDecimal && end === source.length - 1) {
                    token += current;
                    seenDecimal = true;
                    end += 1;
                    continue;
                }
                break;
            }

            output += localizeCanonicalNumber(canonicalNumberString(token), locale, true);
            index = end;
            continue;
        }

        output += char;
        index += 1;
    }

    return output;
};
const displayIndexToRaw = (display, index) => display.substring(0, index).replace(/\s+/g, "").length;
const rawIndexToDisplay = (display, rawindex) => {
    if (rawindex <= 0) {
        return 0;
    }

    let visible = 0;
    for (let index = 0; index < display.length; index += 1) {
        if (display[index] !== " ") {
            visible += 1;
        }
        if (visible >= rawindex) {
            return index + 1;
        }
    }

    return display.length;
};

const tokenize = (source) => {
    const tokens = [];
    let index = 0;
    while (index < source.length) {
        const char = source[index];
        if (isDigit(char) || ((char === "." || char === ",") && isDigit(source[index + 1] || ""))) {
            let end = index + 1;
            let seenDecimal = char === "." || char === ",";
            let normalizednumber = isDigit(char) ? char : ".";
            while (end < source.length) {
                const current = source[end];
                if (isDigit(current)) {
                    normalizednumber += current;
                    end += 1;
                    continue;
                }
                if ((current === "." || current === ",") && !seenDecimal) {
                    normalizednumber += ".";
                    seenDecimal = true;
                    end += 1;
                    continue;
                }
                break;
            }
            tokens.push({type: "number", value: normalizednumber});
            index = end;
            continue;
        }
        if (isAlpha(char)) {
            let end = index + 1;
            while (end < source.length && /[a-z0-9_]/i.test(source[end])) {
                end += 1;
            }
            tokens.push({type: "identifier", value: source.slice(index, end)});
            index = end;
            continue;
        }
        if ("+-*/%^(),;!".includes(char)) {
            tokens.push({type: "operator", value: char === ";" ? "," : char});
            index += 1;
            continue;
        }
        throw new Error("errorinvalidexpression");
    }
    return tokens;
};

const popUntilOpeningParenthesis = (operators, output) => {
    while (operators.length && operators[operators.length - 1].value !== "(") {
        output.push(operators.pop());
    }
};

const processIdentifierToken = (token, nextToken, operators, argumentsStack, output) => {
    if (nextToken && nextToken.type === "operator" && nextToken.value === "(") {
        operators.push({type: "function", value: token.value});
        argumentsStack.push(0);
    } else {
        output.push(token);
    }
};

const processFunctionSeparator = (operators, argumentsStack, output) => {
    popUntilOpeningParenthesis(operators, output);
    if (!operators.length || !argumentsStack.length) {
        throw new Error("errorinvalidexpression");
    }
    argumentsStack[argumentsStack.length - 1] += 1;
};

const processOpeningParenthesis = (token, nextToken, operators, argumentsStack) => {
    operators.push(token);
    const isEmptyFunction = nextToken && nextToken.type === "operator" && nextToken.value === ")";
    if (argumentsStack.length && !isEmptyFunction) {
        argumentsStack[argumentsStack.length - 1] = Math.max(argumentsStack[argumentsStack.length - 1], 1);
    }
};

const processClosingParenthesis = (operators, argumentsStack, output) => {
    popUntilOpeningParenthesis(operators, output);
    if (!operators.length) {
        throw new Error("errorinvalidexpression");
    }
    operators.pop();
    if (operators.length && operators[operators.length - 1].type === "function") {
        const fn = operators.pop();
        output.push({type: "function", value: fn.value, argc: argumentsStack.pop()});
    }
};

const pushRpnOperator = (token, previousToken, operators, output) => {
    const previousAllowsUnary = !previousToken ||
        (previousToken.type === "operator" && previousToken.value !== ")" && previousToken.value !== "!");
    const operator = token.value === "-" && previousAllowsUnary ? "NEG" : token.value;

    while (operators.length) {
        const top = operators[operators.length - 1];
        if (top.type === "function" || top.value === "(") {
            break;
        }
        const topPrecedence = PRECEDENCE[top.value];
        const currentPrecedence = PRECEDENCE[operator];
        const shouldPop = RIGHT_ASSOCIATIVE[operator]
            ? currentPrecedence < topPrecedence
            : currentPrecedence <= topPrecedence;
        if (!shouldPop) {
            break;
        }
        output.push(operators.pop());
    }
    operators.push({type: "operator", value: operator});
};

const processRpnToken = (token, previousToken, nextToken, operators, argumentsStack, output) => {
    if (token.type === "number") {
        output.push(token);
    } else if (token.type === "identifier") {
        processIdentifierToken(token, nextToken, operators, argumentsStack, output);
    } else if (token.value === ",") {
        processFunctionSeparator(operators, argumentsStack, output);
    } else if (token.value === "(") {
        processOpeningParenthesis(token, nextToken, operators, argumentsStack);
    } else if (token.value === ")") {
        processClosingParenthesis(operators, argumentsStack, output);
    } else {
        pushRpnOperator(token, previousToken, operators, output);
    }
};

const toRpn = (tokens) => {
    const output = [];
    const operators = [];
    const argumentsStack = [];

    tokens.forEach((token, position) => {
        processRpnToken(token, tokens[position - 1], tokens[position + 1], operators, argumentsStack, output);
    });

    while (operators.length) {
        const token = operators.pop();
        if (token.value === "(" || token.value === ")") {
            throw new Error("errorinvalidexpression");
        }
        output.push(token);
    }
    return output;
};

const resolveIdentifier = (identifier) => {
    const lowered = identifier.toLowerCase();
    if (lowered === "pi") {
        return Math.PI;
    }
    if (lowered === "e") {
        return Math.E;
    }
    throw new Error("errorinvalidexpression");
};

const toRadians = (value, angleMode) => angleMode === "DEG" ? (value * Math.PI / 180) : value;
const fromRadians = (value, angleMode) => angleMode === "DEG" ? (value * 180 / Math.PI) : value;
const ensureFinite = (value) => {
    if (!Number.isFinite(value)) {
        throw new Error("erroroverflow");
    }
    return value;
};

const factorial = (value) => {
    if (!Number.isInteger(value) || value < 0) {
        throw new Error("errorfactorial");
    }
    let total = 1;
    for (let i = 2; i <= value; i += 1) {
        total *= i;
        ensureFinite(total);
    }
    return total;
};

const FUNCTION_HANDLERS = {
    sin: (args, angleMode) => ensureFinite(Math.sin(toRadians(args[0], angleMode))),
    cos: (args, angleMode) => ensureFinite(Math.cos(toRadians(args[0], angleMode))),
    tan: (args, angleMode) => ensureFinite(Math.tan(toRadians(args[0], angleMode))),
    asin: (args, angleMode) => {
        if (args[0] < -1 || args[0] > 1) {
            throw new Error("errordomain");
        }
        return ensureFinite(fromRadians(Math.asin(args[0]), angleMode));
    },
    acos: (args, angleMode) => {
        if (args[0] < -1 || args[0] > 1) {
            throw new Error("errordomain");
        }
        return ensureFinite(fromRadians(Math.acos(args[0]), angleMode));
    },
    atan: (args, angleMode) => ensureFinite(fromRadians(Math.atan(args[0]), angleMode)),
    sqrt: (args) => {
        if (args[0] < 0) {
            throw new Error("errordomain");
        }
        return ensureFinite(Math.sqrt(args[0]));
    },
    abs: (args) => ensureFinite(Math.abs(args[0])),
    ln: (args) => {
        if (args[0] <= 0) {
            throw new Error("errordomain");
        }
        return ensureFinite(Math.log(args[0]));
    },
    log: (args) => {
        if (args[0] <= 0) {
            throw new Error("errordomain");
        }
        return ensureFinite(Math.log(args[0]) / Math.log(10));
    },
    exp: (args) => ensureFinite(Math.exp(args[0])),
    pow: (args) => ensureFinite(Math.pow(args[0], args[1])),
    min: (args) => ensureFinite(Math.min.apply(null, args)),
    max: (args) => ensureFinite(Math.max.apply(null, args)),
    round: (args) => ensureFinite(Math.round(args[0])),
    floor: (args) => ensureFinite(Math.floor(args[0])),
    ceil: (args) => ensureFinite(Math.ceil(args[0])),
};

const callFunction = (name, args, angleMode) => {
    const fnName = name.toLowerCase();
    const meta = SUPPORTED_FUNCTIONS[fnName];
    const handler = FUNCTION_HANDLERS[fnName];
    if (!meta || !handler) {
        throw new Error("errorunknownfunction");
    }
    if (args.length < meta.min || args.length > meta.max) {
        throw new Error("errorarity");
    }
    return handler(args, angleMode);
};

const evaluateExpression = (expression, angleMode) => {
    const normalized = normalizeInput(expression);
    if (!normalized) {
        throw new Error("errorinvalidexpression");
    }
    const rpn = toRpn(tokenize(normalized));
    const stack = [];
    rpn.forEach((token) => {
        if (token.type === "number") {
            const value = Number(token.value);
            if (Number.isNaN(value)) {
                throw new Error("errorinvalidnumber");
            }
            stack.push(value);
            return;
        }
        if (token.type === "identifier") {
            stack.push(resolveIdentifier(token.value));
            return;
        }
        if (token.type === "function") {
            if (stack.length < token.argc) {
                throw new Error("errorinvalidexpression");
            }
            stack.push(callFunction(token.value, stack.splice(stack.length - token.argc, token.argc), angleMode));
            return;
        }
        if (token.value === "NEG") {
            if (!stack.length) {
                throw new Error("errorinvalidexpression");
            }
            stack.push(-stack.pop());
            return;
        }
        if (token.value === "!") {
            if (!stack.length) {
                throw new Error("errorinvalidexpression");
            }
            stack.push(factorial(stack.pop()));
            return;
        }
        if (stack.length < 2) {
            throw new Error("errorinvalidexpression");
        }
        const right = stack.pop();
        const left = stack.pop();
        switch (token.value) {
            case "+": stack.push(ensureFinite(left + right)); break;
            case "-": stack.push(ensureFinite(left - right)); break;
            case "*": stack.push(ensureFinite(left * right)); break;
            case "/":
                if (right === 0) {
                    throw new Error("errordivisionbyzero");
                }
                stack.push(ensureFinite(left / right)); break;
            case "%":
                if (right === 0) {
                    throw new Error("errordivisionbyzero");
                }
                stack.push(ensureFinite(left % right)); break;
            case "^": stack.push(ensureFinite(Math.pow(left, right))); break;
            default: throw new Error("errorinvalidexpression");
        }
    });
    if (stack.length !== 1) {
        throw new Error("errorinvalidexpression");
    }
    return ensureFinite(stack[0]);
};

const formatResult = (value, locale, usegrouping) => {
    const text = Number.isInteger(value) ? String(value) : String(Number(value.toFixed(10)));
    return localizeCanonicalNumber(text, locale, usegrouping !== false);
};
const updateError = (errorNode, message) => {
    if (!message) {
        errorNode.textContent = "";
        errorNode.classList.remove("is-visible");
        return;
    }
    errorNode.textContent = message;
    errorNode.classList.add("is-visible");
};
const focusInput = (input) => {
    const position = input.value.length;
    input.focus();
    input.setSelectionRange(position, position);
};
const escapeHtml = (text) => String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
const renderHistory = (historyNode, historyItems) => {
    historyNode.innerHTML = historyItems.map((item) =>
        '<div class="advanced-calculator__history-item"><div class="advanced-calculator__history-expression">' +
        escapeHtml(item.expression) + '</div><div class="advanced-calculator__history-result">= ' +
        escapeHtml(item.result) + "</div></div>"
    ).join("");
};
const addHistory = (historyNode, historyItems, expression, result) => {
    historyItems.unshift({expression: expression, result: result});
    historyItems.splice(MAX_HISTORY_ITEMS);
    renderHistory(historyNode, historyItems);
};
const clearHistory = (historyNode, historyItems) => {
    historyItems.splice(0, historyItems.length);
    renderHistory(historyNode, historyItems);
};

const bindScientificCalculator = (root, locale) => {
    const input = root.querySelector('[data-region="display"]');
    const operation = root.querySelector('[data-region="operation"]');
    const error = root.querySelector('[data-region="error"]');
    const historyNode = root.querySelector('[data-region="history"]');
    const toggles = root.querySelectorAll('[data-action="angle-mode"]');
    let angleMode = "DEG";
    let memoryValue = null;
    let historyItems = [];
    const state = {justEvaluated: false, lastResultText: "", expression: "0"};
    const renderExpression = (rawcursorposition) => {
        const displayvalue = formatExpressionForDisplay(state.expression, locale);
        input.value = displayvalue;
        if (typeof rawcursorposition === "number") {
            const displayposition = rawIndexToDisplay(displayvalue, rawcursorposition);
            input.setSelectionRange(displayposition, displayposition);
        }
    };

    const insertAtCursor = (text) => {
        const displayvalue = input.value;
        const start = displayIndexToRaw(displayvalue, input.selectionStart || 0);
        const end = displayIndexToRaw(displayvalue, input.selectionEnd || 0);
        if (!state.justEvaluated && state.expression === "0" && /^[0-9]$/.test(text)) {
            state.expression = text;
            renderExpression(1);
            input.focus();
            return;
        }
        if (!state.justEvaluated && state.expression === "0" && (text === "." || text === ",")) {
            state.expression = "0" + locale.decimalSeparator;
            renderExpression(state.expression.length);
            input.focus();
            return;
        }
        if (!state.justEvaluated && state.expression === "0" && ["pi", "e", "("].includes(text)) {
            state.expression = text;
            renderExpression(state.expression.length);
            input.focus();
            return;
        }
        state.expression = state.expression.substring(0, start) + text + state.expression.substring(end);
        renderExpression(start + text.length);
        input.focus();
    };
    const deleteAtCursor = (direction) => {
        const displayvalue = input.value;
        let start = displayIndexToRaw(displayvalue, input.selectionStart || 0);
        let end = displayIndexToRaw(displayvalue, input.selectionEnd || 0);

        if (start === end) {
            if (direction === "backward" && start > 0) {
                start -= 1;
            } else if (direction === "forward" && end < state.expression.length) {
                end += 1;
            } else {
                return;
            }
        }

        state.expression = state.expression.substring(0, start) + state.expression.substring(end);
        if (state.expression === "" || state.expression === "-") {
            state.expression = "0";
            renderExpression(state.expression.length);
        } else {
            renderExpression(start);
        }
    };
    const prepareInputForInsert = (value) => {
        if (!state.justEvaluated) {
            return;
        }
        if (isEntryCharacter(value)) {
            state.expression = "";
            renderExpression(0);
            state.justEvaluated = false;
            return;
        }
        if (isOperatorCharacter(value) && state.expression === "") {
            state.expression = state.lastResultText;
            renderExpression(state.expression.length);
            state.justEvaluated = false;
        }
    };
    const prepareInputForContinuation = () => {
        if (state.justEvaluated && state.expression === "" && state.lastResultText !== "") {
            state.expression = state.lastResultText;
            renderExpression(state.expression.length);
            state.justEvaluated = false;
        }
    };
    const toggleSign = () => {
        const value = state.expression.trim();
        if (!value) {
            state.expression = "-";
            renderExpression(state.expression.length);
            return;
        }
        state.expression = value.charAt(0) === "-" ? value.slice(1) : "-" + value;
        renderExpression(state.expression.length);
    };
    const applyUnaryOperation = (operationName) => {
        const baseValue = state.expression.trim() || state.lastResultText || "0";
        state.justEvaluated = false;
        if (operationName === "reciprocal") {
            state.expression = "1/(" + baseValue + ")";
        }
        if (operationName === "square") {
            state.expression = "(" + baseValue + ")^2";
        }
        if (operationName === "sqrt") {
            state.expression = "sqrt(" + baseValue + ")";
        }
        renderExpression(state.expression.length);
    };
    const beginFunction = (functionText) => {
        const expression = state.expression.trim();
        const functionName = functionText.slice(0, -1);

        if (state.justEvaluated && state.lastResultText !== "") {
            state.expression = functionName === "pow"
                ? "pow(" + state.lastResultText + ";"
                : functionText + state.lastResultText + ")";
            state.justEvaluated = false;
        } else if (expression === "" || expression === "0") {
            state.expression = functionText;
        } else if (/[+\-*/^(,;]$/.test(expression)) {
            state.expression += functionText;
        } else {
            state.expression = functionName === "pow"
                ? "pow(" + expression + ";"
                : functionText + expression + ")";
        }

        renderExpression(state.expression.length);
    };
    const clearCurrentEntry = () => {
        const expression = state.expression.trim();
        const match = expression.match(/^(.*[+\-*/^])(-?\d*(?:[.,]\d*)?)$/);
        state.expression = match ? match[1] : "0";
        renderExpression(state.expression.length);
        state.justEvaluated = false;
    };
    const insertOperator = (value) => {
        if (state.justEvaluated) {
            state.expression = state.lastResultText;
            state.justEvaluated = false;
        }
        if (state.expression === "" && value === "-") {
            state.expression = "-";
            renderExpression(state.expression.length);
            return;
        }
        if (/[+\-*/^]$/.test(state.expression)) {
            state.expression = state.expression.replace(/[+\-*/^]+$/, value);
            renderExpression(state.expression.length);
            return;
        }
        insertAtCursor(value);
    };
    const applyPercent = () => {
        const expression = state.expression.trim();
        if (!expression) {
            state.expression = "0";
            renderExpression(state.expression.length);
            state.justEvaluated = false;
            return;
        }

        const normalizedExpression = normalizeInput(expression);
        const match = normalizedExpression.match(/^(.+?)([+\-*/])(-?\d+(?:\.\d+)?)$/);

        try {
            if (match) {
                const leftValue = evaluateExpression(match[1], angleMode);
                const rightValue = Number(match[3]);
                const percentValue = (match[2] === "+" || match[2] === "-")
                    ? (leftValue * rightValue / 100)
                    : (rightValue / 100);
                state.expression = match[1] + match[2] + formatResult(percentValue, locale, false);
            } else {
                const currentValue = evaluateExpression(expression, angleMode);
                state.expression = formatResult(currentValue / 100, locale, false);
            }
            renderExpression(state.expression.length);
            state.justEvaluated = false;
        } catch (exception) {
            updateError(error, messages[exception.message] || messages.errorinvalidexpression || "Error");
        }
    };
    const runEvaluation = () => {
        try {
            const expression = state.expression.trim();
            const value = evaluateExpression(expression, angleMode);
            const formattedValue = formatResult(value, locale, true);
            const rawFormattedValue = formatResult(value, locale, false);
            operation.textContent = formatExpressionForDisplay(expression, locale) + " =";
            state.lastResultText = rawFormattedValue;
            state.justEvaluated = true;
            addHistory(historyNode, historyItems, expression, formattedValue);
            state.expression = rawFormattedValue;
            renderExpression(state.expression.length);
            updateError(error, "");
            focusInput(input);
        } catch (exception) {
            updateError(error, messages[exception.message] || messages.errorinvalidexpression || "Error");
        }
    };
    const insertValue = (value) => {
        if (isOperatorCharacter(value)) {
            insertOperator(value);
        } else {
            prepareInputForInsert(value);
            prepareInputForContinuation();
            insertAtCursor(value);
        }
        updateError(error, "");
    };
    const adjustMemory = (direction) => {
        try {
            const expression = state.expression.trim() || state.lastResultText || "0";
            const current = Number(evaluateExpression(expression, angleMode));
            memoryValue = (memoryValue === null ? 0 : memoryValue) + (direction * current);
            updateError(error, "");
        } catch (exception) {
            updateError(error, messages[exception.message] || messages.errorinvalidexpression || "Error");
        }
        focusInput(input);
    };
    const setAngleMode = (value) => {
        angleMode = value;
        toggles.forEach((toggle) => {
            const isActive = toggle.getAttribute("data-value") === value;
            toggle.classList.toggle("is-active", isActive);
            toggle.setAttribute("aria-pressed", String(isActive));
        });
        updateError(error, "");
        focusInput(input);
    };
    const actionHandlers = {
        insert: insertValue,
        func: (value) => {
            beginFunction(value);
            updateError(error, "");
            focusInput(input);
        },
        clear: () => {
            state.expression = "0";
            operation.textContent = "";
            state.justEvaluated = false;
            state.lastResultText = "";
            updateError(error, "");
            renderExpression(state.expression.length);
            focusInput(input);
        },
        "clear-entry": () => {
            clearCurrentEntry();
            updateError(error, "");
            focusInput(input);
        },
        "history-clear": () => {
            clearHistory(historyNode, historyItems);
            updateError(error, "");
            focusInput(input);
        },
        backspace: () => {
            prepareInputForContinuation();
            deleteAtCursor("backward");
            updateError(error, "");
            focusInput(input);
        },
        sign: () => {
            prepareInputForContinuation();
            toggleSign();
            updateError(error, "");
            focusInput(input);
        },
        unary: (value) => {
            applyUnaryOperation(value);
            updateError(error, "");
            focusInput(input);
        },
        percent: () => {
            prepareInputForContinuation();
            applyPercent();
            updateError(error, "");
            focusInput(input);
        },
        evaluate: runEvaluation,
        "memory-clear": () => {
            memoryValue = null;
            updateError(error, "");
            focusInput(input);
        },
        "memory-add": () => adjustMemory(1),
        "memory-subtract": () => adjustMemory(-1),
        "memory-recall": () => {
            prepareInputForContinuation();
            if (memoryValue !== null) {
                insertAtCursor(formatResult(memoryValue, locale, false));
            }
            updateError(error, "");
            focusInput(input);
        },
        "angle-mode": setAngleMode,
    };

    root.addEventListener("mousedown", (event) => {
        const button = event.target.closest("[data-action]");
        if (button) {
            event.preventDefault();
        }
    });

    root.addEventListener("click", (event) => {
        const button = event.target.closest("[data-action]");
        if (!button) {
            return;
        }
        const action = button.getAttribute("data-action");
        const value = button.getAttribute("data-value") || "";
        const handler = actionHandlers[action];
        if (handler) {
            handler(value);
        }
    });

    input.addEventListener("keydown", (event) => {
        if (event.ctrlKey || event.altKey || event.metaKey) {
            return;
        }
        if (/^[0-9]$/.test(event.key)) {
            event.preventDefault();
            prepareInputForInsert(event.key);
            prepareInputForContinuation();
            insertAtCursor(event.key);
            updateError(error, "");
            focusInput(input);
            return;
        }
        if (/^[a-zA-Z]$/.test(event.key) || ["(", ")", "^", "!"].includes(event.key)) {
            event.preventDefault();
            prepareInputForInsert(event.key);
            prepareInputForContinuation();
            insertAtCursor(event.key);
            updateError(error, "");
            focusInput(input);
            return;
        }
        if (["+", "-", "*", "/"].includes(event.key)) {
            event.preventDefault();
            prepareInputForContinuation();
            insertOperator(event.key);
            updateError(error, "");
            focusInput(input);
            return;
        }
        if (event.key === "%") {
            event.preventDefault();
            prepareInputForContinuation();
            applyPercent();
            updateError(error, "");
            focusInput(input);
            return;
        }
        if (event.key === "." || event.key === ",") {
            event.preventDefault();
            prepareInputForInsert(locale.decimalSeparator);
            prepareInputForContinuation();
            insertAtCursor(locale.decimalSeparator);
            updateError(error, "");
            focusInput(input);
            return;
        }
        if (event.key === "Backspace") {
            event.preventDefault();
            prepareInputForContinuation();
            deleteAtCursor("backward");
            updateError(error, "");
            focusInput(input);
            return;
        }
        if (event.key === "Delete") {
            event.preventDefault();
            state.expression = "0";
            state.justEvaluated = false;
            state.lastResultText = "";
            updateError(error, "");
            renderExpression(state.expression.length);
            operation.textContent = "";
            updateError(error, "");
            focusInput(input);
            return;
        }
        if (event.key === "Enter") {
            event.preventDefault();
            runEvaluation();
            return;
        }
        if (event.key === "Escape") {
            event.preventDefault();
            state.expression = "0";
            operation.textContent = "";
            state.justEvaluated = false;
            state.lastResultText = "";
            updateError(error, "");
            renderExpression(state.expression.length);
            focusInput(input);
        }
    });

    input.addEventListener("copy", (event) => {
        event.preventDefault();
        event.clipboardData.setData("text/plain", state.expression);
    });

    input.addEventListener("paste", (event) => {
        const text = event.clipboardData.getData("text/plain");
        if (!text) {
            return;
        }
        event.preventDefault();
        prepareInputForContinuation();
        insertAtCursor(String(text).replace(/\s+/g, ""));
        updateError(error, "");
        focusInput(input);
    });

    renderHistory(historyNode, historyItems);
    operation.textContent = "";
    renderExpression(state.expression.length);
};

const bindStandardCalculator = (root, locale) => {
    const input = root.querySelector('[data-region="display"]');
    const operation = root.querySelector('[data-region="operation"]');
    const error = root.querySelector('[data-region="error"]');
    const historyNode = root.querySelector('[data-region="history"]');
    let historyItems = [];
    let memoryValue = null;

    const state = {
        accumulator: null,
        pendingOperator: null,
        rawValue: "0",
        overwriteDisplay: true,
        justEvaluated: false,
        lastOperator: null,
        lastOperand: null,
    };

    const syncDisplay = () => {
        input.value = localizeCanonicalNumber(state.rawValue, locale, true);
    };
    const renderOperation = () => {
        if (state.pendingOperator && state.accumulator !== null) {
            operation.textContent = formatResult(state.accumulator, locale, true) + state.pendingOperator;
        } else {
            operation.textContent = "";
        }
    };
    const setDisplayNumber = (value) => {
        state.rawValue = Number.isInteger(value) ? String(value) : String(Number(value.toFixed(10)));
        syncDisplay();
    };
    const currentNumber = () => Number(state.rawValue.endsWith(".") ? state.rawValue + "0" : state.rawValue);
    const computeBinary = (left, operatorSymbol, right) => {
        switch (operatorSymbol) {
            case "+": return left + right;
            case "-": return left - right;
            case "*": return left * right;
            case "/":
                if (right === 0) {
                    throw new Error("errordivisionbyzero");
                }
                return left / right;
            default: throw new Error("errorinvalidexpression");
        }
    };
    const pushHistory = (expression, result) => addHistory(historyNode, historyItems, expression, result);

    const inputDigit = (value) => {
        const normalizedValue = value === "." || value === "," ? "." : value;
        if (state.justEvaluated) {
            state.accumulator = null;
            state.pendingOperator = null;
            state.lastOperator = null;
            state.lastOperand = null;
            operation.textContent = "";
            state.rawValue = normalizedValue === "." ? "0." : normalizedValue;
            state.overwriteDisplay = false;
            state.justEvaluated = false;
            syncDisplay();
            return;
        }
        if (state.overwriteDisplay) {
            state.rawValue = normalizedValue === "." ? "0." : normalizedValue;
            state.overwriteDisplay = false;
        } else if (normalizedValue === "." && state.rawValue.includes(".")) {
            return;
        } else if (state.rawValue === "0" && normalizedValue !== ".") {
            state.rawValue = normalizedValue;
        } else {
            state.rawValue += normalizedValue;
        }
        syncDisplay();
    };

    const applyOperator = (nextOperator) => {
        const current = currentNumber();
        if (state.pendingOperator !== null) {
            if (state.overwriteDisplay) {
                state.pendingOperator = nextOperator;
                renderOperation();
                return;
            }
            try {
                const result = computeBinary(state.accumulator, state.pendingOperator, current);
                state.accumulator = result;
                setDisplayNumber(result);
            } catch (exception) {
                updateError(error, messages[exception.message] || messages.errorinvalidexpression || "Error");
                return;
            }
        } else {
            state.accumulator = current;
        }
        state.pendingOperator = nextOperator;
        state.overwriteDisplay = true;
        state.justEvaluated = false;
        state.lastOperator = null;
        state.lastOperand = null;
        updateError(error, "");
        renderOperation();
    };

    const applyEquals = () => {
        try {
            if (state.pendingOperator !== null) {
                const operand = state.overwriteDisplay ? state.accumulator : currentNumber();
                const left = state.accumulator;
                const result = computeBinary(left, state.pendingOperator, operand);
                const expression = formatResult(left, locale, true) + state.pendingOperator + formatResult(operand, locale, true);
                setDisplayNumber(result);
                operation.textContent = expression + " =";
                pushHistory(expression, formatResult(result, locale, true));
                state.lastOperator = state.pendingOperator;
                state.lastOperand = operand;
                state.pendingOperator = null;
                state.accumulator = result;
                state.overwriteDisplay = true;
                state.justEvaluated = true;
                updateError(error, "");
                return;
            }
            if (state.lastOperator !== null && state.lastOperand !== null) {
                const left = currentNumber();
                const result = computeBinary(left, state.lastOperator, state.lastOperand);
                const expression = formatResult(left, locale, true) +
                    state.lastOperator +
                    formatResult(state.lastOperand, locale, true);
                setDisplayNumber(result);
                operation.textContent = expression + " =";
                pushHistory(expression, formatResult(result, locale, true));
                state.accumulator = result;
                state.justEvaluated = true;
                updateError(error, "");
            }
        } catch (exception) {
            updateError(error, messages[exception.message] || messages.errorinvalidexpression || "Error");
        }
    };

    const applyPercent = () => {
        if (state.pendingOperator === null || state.accumulator === null) {
            return;
        }
        const right = currentNumber();
        const percentValue = (state.pendingOperator === "+" || state.pendingOperator === "-")
            ? state.accumulator * right / 100
            : right / 100;
        setDisplayNumber(percentValue);
        state.overwriteDisplay = false;
        state.justEvaluated = false;
        updateError(error, "");
    };

    const clearEntry = () => {
        state.rawValue = "0";
        state.overwriteDisplay = true;
        state.justEvaluated = false;
        syncDisplay();
    };

    const clearAll = () => {
        state.accumulator = null;
        state.pendingOperator = null;
        state.rawValue = "0";
        state.overwriteDisplay = true;
        state.justEvaluated = false;
        state.lastOperator = null;
        state.lastOperand = null;
        operation.textContent = "";
        updateError(error, "");
        syncDisplay();
    };

    const backspace = () => {
        if (state.overwriteDisplay || state.justEvaluated) {
            return;
        }
        if (state.rawValue.length <= 1 || (state.rawValue.length === 2 && state.rawValue.startsWith("-"))) {
            state.rawValue = "0";
            state.overwriteDisplay = true;
        } else {
            state.rawValue = state.rawValue.slice(0, -1);
            if (state.rawValue === "-" || state.rawValue === "") {
                state.rawValue = "0";
                state.overwriteDisplay = true;
            }
        }
        syncDisplay();
    };

    const toggleDisplaySign = () => {
        if (state.rawValue === "0") {
            return;
        }
        state.rawValue = state.rawValue.startsWith("-") ? state.rawValue.slice(1) : "-" + state.rawValue;
        syncDisplay();
    };

    const applyUnaryOperation = (operationName) => {
        try {
            const current = currentNumber();
            if (operationName === "reciprocal") {
                if (current === 0) {
                    throw new Error("errordivisionbyzero");
                }
                setDisplayNumber(1 / current);
            }
            if (operationName === "square") {
                setDisplayNumber(current * current);
            }
            if (operationName === "sqrt") {
                if (current < 0) {
                    throw new Error("errordomain");
                }
                setDisplayNumber(Math.sqrt(current));
            }
            state.overwriteDisplay = true;
            state.justEvaluated = false;
            updateError(error, "");
        } catch (exception) {
            updateError(error, messages[exception.message] || messages.errorinvalidexpression || "Error");
        }
    };
    const handleKeyboardKey = (key) => {
        if (/^[0-9]$/.test(key)) {
            inputDigit(key);
            updateError(error, "");
            return true;
        }
        if (key === "." || key === ",") {
            inputDigit(",");
            updateError(error, "");
            return true;
        }
        if (["+", "-", "*", "/"].includes(key)) {
            applyOperator(key);
            return true;
        }
        if (key === "Enter" || key === "=") {
            applyEquals();
            return true;
        }
        if (key === "%") {
            applyPercent();
            return true;
        }
        if (key === "Backspace") {
            backspace();
            return true;
        }
        if (key === "Delete") {
            clearEntry();
            return true;
        }
        if (key === "Escape") {
            clearAll();
            return true;
        }
        return false;
    };
    const recallMemory = () => {
        if (memoryValue === null) {
            return;
        }
        state.rawValue = Number.isInteger(memoryValue)
            ? String(memoryValue)
            : String(Number(memoryValue.toFixed(10)));
        state.overwriteDisplay = true;
        state.justEvaluated = false;
        syncDisplay();
    };
    const actionHandlers = {
        insert: (value) => {
            if (isOperatorCharacter(value)) {
                applyOperator(value);
            } else {
                inputDigit(value);
                updateError(error, "");
            }
        },
        evaluate: applyEquals,
        percent: applyPercent,
        "clear-entry": clearEntry,
        clear: clearAll,
        "history-clear": () => clearHistory(historyNode, historyItems),
        backspace: backspace,
        sign: toggleDisplaySign,
        unary: applyUnaryOperation,
        "memory-clear": () => {
            memoryValue = null;
        },
        "memory-recall": recallMemory,
        "memory-add": () => {
            memoryValue = (memoryValue === null ? 0 : memoryValue) + currentNumber();
        },
        "memory-subtract": () => {
            memoryValue = (memoryValue === null ? 0 : memoryValue) - currentNumber();
        },
    };

    root.addEventListener("mousedown", (event) => {
        const button = event.target.closest("[data-action]");
        if (button) {
            event.preventDefault();
        }
    });

    root.addEventListener("click", (event) => {
        const button = event.target.closest("[data-action]");
        if (!button) {
            return;
        }
        const action = button.getAttribute("data-action");
        const value = button.getAttribute("data-value") || "";
        const handler = actionHandlers[action];
        if (handler) {
            handler(value);
            focusInput(input);
        }
    });

    input.addEventListener("keydown", (event) => {
        if (event.ctrlKey || event.altKey || event.metaKey) {
            return;
        }
        if (handleKeyboardKey(event.key)) {
            event.preventDefault();
            focusInput(input);
        }
    });
    input.addEventListener("copy", (event) => {
        event.preventDefault();
        event.clipboardData.setData("text/plain", localizeCanonicalNumber(state.rawValue, locale, false));
    });
    input.addEventListener("paste", (event) => {
        const text = event.clipboardData.getData("text/plain");
        if (!text) {
            return;
        }
        event.preventDefault();
        state.rawValue = canonicalNumberString(text);
        state.overwriteDisplay = false;
        state.justEvaluated = false;
        updateError(error, "");
        syncDisplay();
        focusInput(input);
    });
    input.addEventListener("input", () => {
        state.rawValue = canonicalNumberString(input.value);
        syncDisplay();
    });

    renderHistory(historyNode, historyItems);
    syncDisplay();
};

export const init = async(config) => {
    await loadStrings();
    const root = document.getElementById(config.elementid);
    if (!root) {
        return;
    }
    const locale = createLocale(config.decimalseparator);
    if (config.mode === "scientific") {
        bindScientificCalculator(root, locale);
    } else {
        bindStandardCalculator(root, locale);
    }
};
