const t = require('@babel/types');
const generate = require('@babel/generator').default;
const utils = require('../utils/index');
const chalk = require('chalk');
const { createElement, createAttribute } = utils;
/**
 * 本模板将array.map(fn)变成<block a:for="{{}}"></block>
 * 将if(xxx){}变成<block a:if="{{xxx}}"></block>
 * 将xxx? aaa: bbb变成<block a:if="aaa">aaa</block>
 * <block a:if="!xxx">bbb</block>
 */
const rexpr = /(^|[^\w.])this\./g;

function parseExpr(node) {
    return `{{${generate(node).code.replace(rexpr, '$1')}}}`;
}

function wrapText(node) {
    if (node.type !== 'JSXElement') {
        return t.JSXText(parseExpr(node));
    }
    return node;
}
//必须返回一个数组
function logic(expr, modules) {
    // 处理条件指令
    if (t.isConditionalExpression(expr) || t.isIfStatement(expr)) {
        return condition(expr.test, expr.consequent, expr.alternate, modules);
    } else if (t.isLogicalExpression(expr) && expr.operator === '&&') {
        return condition(expr.left, expr.right, null, modules);
    } else if (
        t.isCallExpression(expr) &&
        expr.callee.property && expr.callee.property.name === 'map'
    ) {
        // 处理列表指令
        if (expr.arguments[0].type === 'ArrowFunctionExpression') {
            return loop(expr.callee, expr.arguments[0], modules);
        } else if (
            expr.arguments[0] &&
            expr.arguments[0].type === 'FunctionExpression'
        ) {
            return loop(expr.callee, expr.arguments[0], modules);
        } else {
            throw generate(expr.callee.object).code +
            '.map 后面的必须跟匿名函数或一个函数调用';
        }
    } else {
        return [wrapText(expr)];
    }
}

// 处理 test ? consequent: alternate 或 test && consequent
function condition(test, consequent, alternate, modules) {
    var ifNode = createElement(
        'block',
        [createAttribute('a:if', parseExpr(test))],
        logic(consequent, modules) 
    );
    // null就不用创建一个<block>元素了，&&表达式也不需要创建<block>元素
    if (alternate && alternate.type !== 'NullLiteral') {
        var elseNode = createElement(
            'block',
            [createAttribute('a:else', 'true')],
            logic(alternate, modules)
        );
        return [ifNode, elseNode];
    }
    return [ifNode];
}

// 处理 callee.map(fn)
function loop(callee, fn, modules) {
    const attrs = [];

    attrs.push(createAttribute('a:for', parseExpr(callee.object)));
    attrs.push(createAttribute('a:for-item', fn.params[0].name));
    attrs.push(createAttribute('a:for-index', fn.params[1].name));
    if (modules.key) {
        attrs.push(createAttribute('a:key', utils.genKey(modules.key)));

        modules.key = null;
    } else {
        attrs.push(createAttribute('a:key', '*this'));
        // console.log( fn.params[1].name);
    }

    const body = t.isBlockStatement(fn.body)
        ? fn.body.body.find(t.isReturnStatement)
        : fn.body;

    if (body) {
        // 循环内部存在循环或条件
        var children = logic(
            t.isBlockStatement(fn.body) ? body.argument : body,
            modules
        );

        return [createElement('block', attrs, children)];

    } else {
        // eslint-disable-next-line
        console.log(
            chalk`{cyan .map(fn)} 的函数中需要有 {cyan ReturnStatement}，在 ${
                generate(fn).code} 中未找到 {cyan ReturnStatement}` );
        throw new Error('Parse error');
    }
}

module.exports = logic;