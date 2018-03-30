import { callLifeCycleHook, pushError } from './unwindWork';
import { contextStack, componentStack, hostStack, emptyObject } from '../share';
import { fiberizeChildren } from '../createElement';
import { createInstance } from '../createInstance';
import { WORKING, PLACE, ATTR, DETACH, NOUPDATE, HOOK, CONTENT, REF, NULLREF } from '../effectTag';
import { extend, Flutter, get } from '../util';

export function updateEffects(fiber, topWork) {
	if (fiber.tag > 3) {
		updateHostComponent(fiber);
	} else {
		updateClassComponent(fiber);
	}
	if (fiber.child) {
		if (fiber.shouldUpdateFlase) {
			//...
		} else {
			return fiber.child;
		}
	}

	let f = fiber;
	while (f) {
		if (f.stateNode.getChildContext) {
			contextStack.pop(); // pop context
        }
        if(f.tag === 5){
            hostStack.pop()
        }
		//  completeWork(f, topWork); //collectSideEffect
		if (f === topWork) {
			break;
		}
		if (f.sibling) {
			return f.sibling;
		}
		f = f.return;
	}
}

//用于实例化组件

export function Fiber(vnode) {
	extend(this, vnode);
	let type = vnode.type;
	this.name = type.displayName || type.name || type;
	this.effectTag = 1;
}

function updateHostComponent(fiber) {
	if (!fiber.stateNode) {
		try {
			fiber.stateNode = Flutter.createElement(fiber);
		} catch (e) {
			throw e;
		}
    }
    fiber.parent = hostStack[0]
    if(fiber.tag === 5){
        hostStack.unshift(fiber.stateNode)
    }
	const { props, tag, root } = fiber;
	const children = props && props.children;
	/*
	if (parent) {
		let b = parent.beforeNode;
		fiber.mountPoint = b;
		parent.beforeNode = fiber.stateNode;
    }
    */

	if (tag == 5 && !root) {
		fiber.effectTag *= ATTR;
	}
	if (fiber.tag === 6) {
		const prev = fiber.alternate;
		if (!prev || prev.props.children !== children) {
			fiber.effectTag *= CONTENT;
		}
	} else if (props) {
		diffChildren(fiber, children);
	}
}

function updateClassComponent(fiber) {
	let { type, stateNode: instance, props: nextProps, partialState: nextState, isForceUpdate } = fiber;
	let nextContext = getMaskedContext(type.contextTypes),
		c;

	if (instance == null) {
		instance = fiber.stateNode = createInstance(fiber, nextContext);
		instance.updater.enqueueSetState = Flutter.updateComponent;
		var willReceive = fiber._willReceive;
		delete fiber._willReceive;
		var propsChange = false;
	} else {
		var { props: lastProps, state: lastState } = instance;

		fiber.lastProps = lastProps;
		fiber.lastState = lastState;
		propsChange = lastProps !== nextProps;
	}

	let shouldUpdate = true;
	let updater = instance.updater;

	let stateNoChange = !nextState;

	instance._reactInternalFiber = fiber;
	/*
	if (fiber.parent) {
		fiber.mountPoint = fiber.parent.beforeNode;
    }
    */
	if (instance.getChildContext) {
		try {
			c = instance.getChildContext();
			c = Object.assign({}, nextContext, c);
		} catch (e) {
			c = {};
		}
		contextStack.unshift(c);
	}
	if (!instance._isStateless) {
		updater._hooking = true;

		if (updater._isMounted()) {
			delete fiber.isForceUpdate;
			if (stateNoChange) {
				//只要props/context任于一个发生变化，就会触发cWRP
				willReceive = propsChange || instance.context !== nextContext;
				if (willReceive) {
					callLifeCycleHook(instance, 'componentWillReceiveProps', [ nextProps, nextContext ]);
				}

				if (propsChange) {
					getDerivedStateFromProps(instance, type, nextProps, lastState);
				}
			}
			let args = [ nextProps, nextState, nextContext ];
			if (!isForceUpdate && !callLifeCycleHook(instance, 'shouldComponentUpdate', args)) {
				shouldUpdate = false;
                fiber.shouldUpdateFalse = true;
                console.log("碰到这里",fiber)
			} else {
				callLifeCycleHook(instance, 'componentWillUpdate', args);
			}
		} else {
			getDerivedStateFromProps(instance, type, nextProps, lastState);
			callLifeCycleHook(instance, 'componentWillMount', []);
		}
		updater._hooking = false;
		if (!shouldUpdate) {
			const prev = fiber.alternate;
			if (prev && prev.child) {
				var pc = prev._children;
				var cc = (fiber._children = {});
				fiber.child = prev.child;
				var children = {};
				for (var i in pc) {
					var a = pc[i];
					a.return = fiber;
					cc[i] = a;
				}
			}
			if (componentStack[0] === instance) {
				componentStack.shift();
			}
			return;
		}
	}
	instance.context = nextContext;
	instance.props = nextProps;
	instance.state = fiber.partialState || lastState; //fiber.partialState可能在钩子里被重写

	fiber.effectTag *= HOOK;
	var rendered;
	updater._hydrating = true;
	if (!isForceUpdate && willReceive === false) {
		delete fiber._willReceive;
		let a = fiber.child;
		if (a && a.sibling) {
			rendered = [];
			for (; a; a = a.sibling) {
				rendered.push(a);
			}
		} else {
			rendered = a;
		}
	} else {
		let lastOwn = Flutter.currentOwner;
		Flutter.currentOwner = instance;
		rendered = callLifeCycleHook(instance, 'render', []);
		if (componentStack[0] === instance) {
			componentStack.shift();
		}
		if (updater._hasError) {
			rendered = [];
		}
		Flutter.currentOwner = lastOwn;
	}
	diffChildren(fiber, rendered);
}

function isSameNode(a, b) {
	if (a.type === b.type && a.key === b.key) {
		return true;
	}
}

export function detachFiber(fiber, effects) {
	fiber.effectTag = DETACH;
	if (fiber.ref) {
		fiber.effectTag *= NULLREF;
	}
	fiber.disposed = true;
	if (fiber.tag < 3) {
		fiber.effectTag *= HOOK;
	}
	effects.push(fiber);
	for (let child = fiber.child; child; child = child.sibling) {
		detachFiber(child, effects);
	}
}

var gDSFP = 'getDerivedStateFromProps';
function getDerivedStateFromProps(instance, type, nextProps, lastState) {
	try {
		var method = type[gDSFP];
		if (method) {
			var partialState = method.call(null, nextProps, lastState);
			if (partialState != null) {
				var fiber = get(instance);
				fiber.partialState = Object.assign({}, fiber.partialState || lastState, partialState);
			}
		}
	} catch (error) {
		pushError(instance, gDSFP, error);
	}
}

function getMaskedContext(contextTypes) {
	let context = {};
	if (!contextTypes) {
		return emptyObject;
	}
	let parentContext = contextStack[0],
		hasKey;
	for (let key in contextTypes) {
		if (contextTypes.hasOwnProperty(key)) {
			hasKey = true;
			context[key] = parentContext[key];
		}
	}
	return hasKey ? context : emptyObject;
}

/**
 * 在这里确定parent
 * @param {*} parentFiber 
 * @param {*} children 
 */
function diffChildren(parentFiber, children) {
	let prev = parentFiber.alternate;
	let oldFibers = prev ? prev._children : {}; //旧的

	var newFibers = fiberizeChildren(children, parentFiber); //新的
	var effects = parentFiber.effects || (parentFiber.effects = []);

	let matchFibers = {};
	/*	let parent = parentFiber;
	do {
		if (parent.tag === 5) {
			break;
		}
	} while ((parent = parent.return));
	parent = parent.stateNode;*/
	for (let i in oldFibers) {
		let newFiber = newFibers[i];
		let oldFiber = oldFibers[i];
		if (newFiber && newFiber.type === oldFiber.type) {
			matchFibers[i] = oldFiber;
			if (newFiber.key != null) {
				oldFiber.key = newFiber.key;
			}
			continue;
		}
		detachFiber(oldFiber, effects);
	}

	let prevFiber,
		index = 0;
	for (let i in newFibers) {
		let newFiber = (newFibers[i] = new Fiber(newFibers[i]));
		//	newFiber.parent = parent;

		let oldFiber = matchFibers[i];
		if (oldFiber) {
			if (isSameNode(oldFiber, newFiber)) {
				newFiber.stateNode = oldFiber.stateNode;
				newFiber.stateNode._reactInternalFiber = newFiber;
				newFiber.alternate = oldFiber;

				oldFiber.old = true;
				if (oldFiber.ref && oldFiber.ref !== newFiber.ref) {
					oldFiber.effectTag = NULLREF;
					effects.push(oldFiber);
				}
				if (newFiber.tag === 5) {
					newFiber.lastProps = oldFiber.props;
				}
			} else {
				detachFiber(oldFiber, effects);
			}
		}
		if (newFiber.tag > 3) {
			newFiber.effectTag *= PLACE;
		}
		if (newFiber.ref) {
			newFiber.effectTag *= REF;
		}
		newFiber.index = index++;
		newFiber.return = parentFiber;

		if (prevFiber) {
			prevFiber.sibling = newFiber;
		} else {
			parentFiber.child = newFiber;
		}
		prevFiber = newFiber;
	}
	if (prevFiber) {
		delete prevFiber.sibling;
	}
}

/*
初始化Fiber
*  tag > 3 创建实例
*  tag < 3 创建DOM
       创建children(纯正的)
           初始化第一个孩子Fiber
初始化Fiber.sibling

*/
