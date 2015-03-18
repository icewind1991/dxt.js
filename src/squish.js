// The Module object: Our interface to the outside world. We import
// and export values on it, and do the work to get that through
// closure compiler if necessary. There are various ways Module can be used:
// 1. Not defined. We create it here
// 2. A function parameter, function(Module) { ..generated code.. }
// 3. pre-run appended it, var Module = {}; ..generated code..
// 4. External script tag defines var Module.
// We need to do an eval in order to handle the closure compiler
// case, where this code here is minified but Module was defined
// elsewhere (e.g. case 4 above). We also need to check if Module
// already exists (e.g. case 3 above).
// Note that if you want to run closure, and also to use Module
// after the generated code, you will need to define   var Module = {};
// before the code. Then that object will be used in the code, and you
// can continue to use Module afterwards as well.
var Module;
if (!Module) Module = (typeof Module !== 'undefined' ? Module : null) || {};

// Sometimes an existing Module object exists with properties
// meant to overwrite the default module functionality. Here
// we collect those properties and reapply _after_ we configure
// the current environment's defaults to avoid having to be so
// defensive during initialization.
var moduleOverrides = {};
for (var key in Module) {
  if (Module.hasOwnProperty(key)) {
    moduleOverrides[key] = Module[key];
  }
}

// The environment setup code below is customized to use Module.
// *** Environment setup code ***
var ENVIRONMENT_IS_WEB = typeof window === 'object';
var ENVIRONMENT_IS_NODE = (typeof process === 'object' && typeof require === 'function') && !ENVIRONMENT_IS_WEB;
var ENVIRONMENT_IS_WORKER = typeof importScripts === 'function';
var ENVIRONMENT_IS_SHELL = !ENVIRONMENT_IS_WEB && !ENVIRONMENT_IS_NODE && !ENVIRONMENT_IS_WORKER;

if (typeof module !== 'undefined') {
	module['exports'] = Module;
}

if (ENVIRONMENT_IS_NODE) {
  // Expose functionality in the same simple way that the shells work
  // Note that we pollute the global namespace here, otherwise we break in node
  if (!Module['print']) Module['print'] = function print(x) {
    process['stdout'].write(x + '\n');
  };
  if (!Module['printErr']) Module['printErr'] = function printErr(x) {
    process['stderr'].write(x + '\n');
  };

  var nodeFS = require('fs');
  var nodePath = require('path');

  Module['read'] = function read(filename, binary) {
    filename = nodePath['normalize'](filename);
    var ret = nodeFS['readFileSync'](filename);
    // The path is absolute if the normalized version is the same as the resolved.
    if (!ret && filename != nodePath['resolve'](filename)) {
      filename = path.join(__dirname, '..', 'src', filename);
      ret = nodeFS['readFileSync'](filename);
    }
    if (ret && !binary) ret = ret.toString();
    return ret;
  };

  Module['readBinary'] = function readBinary(filename) { return Module['read'](filename, true) };

  Module['load'] = function load(f) {
    globalEval(read(f));
  };

  if (!Module['thisProgram']) {
    if (process['argv'].length > 1) {
      Module['thisProgram'] = process['argv'][1].replace(/\\/g, '/');
    } else {
      Module['thisProgram'] = 'unknown-program';
    }
  }

  Module['arguments'] = process['argv'].slice(2);

  if (typeof module !== 'undefined') {
    module['exports'] = Module;
  }

  process['on']('uncaughtException', function(ex) {
    // suppress ExitStatus exceptions from showing an error
    if (!(ex instanceof ExitStatus)) {
      throw ex;
    }
  });
}
else if (ENVIRONMENT_IS_SHELL) {
  if (!Module['print']) Module['print'] = print;
  if (typeof printErr != 'undefined') Module['printErr'] = printErr; // not present in v8 or older sm

  if (typeof read != 'undefined') {
    Module['read'] = read;
  } else {
    Module['read'] = function read() { throw 'no read() available (jsc?)' };
  }

  Module['readBinary'] = function readBinary(f) {
    if (typeof readbuffer === 'function') {
      return new Uint8Array(readbuffer(f));
    }
    var data = read(f, 'binary');
    assert(typeof data === 'object');
    return data;
  };

  if (typeof scriptArgs != 'undefined') {
    Module['arguments'] = scriptArgs;
  } else if (typeof arguments != 'undefined') {
    Module['arguments'] = arguments;
  }

}
else if (ENVIRONMENT_IS_WEB || ENVIRONMENT_IS_WORKER) {
  Module['read'] = function read(url) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, false);
    xhr.send(null);
    return xhr.responseText;
  };

  if (typeof arguments != 'undefined') {
    Module['arguments'] = arguments;
  }

  if (typeof console !== 'undefined') {
    if (!Module['print']) Module['print'] = function print(x) {
      console.log(x);
    };
    if (!Module['printErr']) Module['printErr'] = function printErr(x) {
      console.log(x);
    };
  } else {
    // Probably a worker, and without console.log. We can do very little here...
    var TRY_USE_DUMP = false;
    if (!Module['print']) Module['print'] = (TRY_USE_DUMP && (typeof(dump) !== "undefined") ? (function(x) {
      dump(x);
    }) : (function(x) {
      // self.postMessage(x); // enable this if you want stdout to be sent as messages
    }));
  }

  if (ENVIRONMENT_IS_WORKER) {
    Module['load'] = importScripts;
  }

  if (typeof Module['setWindowTitle'] === 'undefined') {
    Module['setWindowTitle'] = function(title) { document.title = title };
  }
}
else {
  // Unreachable because SHELL is dependant on the others
  throw 'Unknown runtime environment. Where are we?';
}

function globalEval(x) {
  eval.call(null, x);
}
if (!Module['load'] && Module['read']) {
  Module['load'] = function load(f) {
    globalEval(Module['read'](f));
  };
}
if (!Module['print']) {
  Module['print'] = function(){};
}
if (!Module['printErr']) {
  Module['printErr'] = Module['print'];
}
if (!Module['arguments']) {
  Module['arguments'] = [];
}
if (!Module['thisProgram']) {
  Module['thisProgram'] = './this.program';
}

// *** Environment setup code ***

// Closure helpers
Module.print = Module['print'];
Module.printErr = Module['printErr'];

// Callbacks
Module['preRun'] = [];
Module['postRun'] = [];

// Merge back in the overrides
for (var key in moduleOverrides) {
  if (moduleOverrides.hasOwnProperty(key)) {
    Module[key] = moduleOverrides[key];
  }
}



// === Preamble library stuff ===

// Documentation for the public APIs defined in this file must be updated in: 
//    site/source/docs/api_reference/preamble.js.rst
// A prebuilt local version of the documentation is available at: 
//    site/build/text/docs/api_reference/preamble.js.txt
// You can also build docs locally as HTML or other formats in site/
// An online HTML version (which may be of a different version of Emscripten)
//    is up at http://kripken.github.io/emscripten-site/docs/api_reference/preamble.js.html

//========================================
// Runtime code shared with compiler
//========================================

var Runtime = {
  setTempRet0: function (value) {
    tempRet0 = value;
  },
  getTempRet0: function () {
    return tempRet0;
  },
  stackSave: function () {
    return STACKTOP;
  },
  stackRestore: function (stackTop) {
    STACKTOP = stackTop;
  },
  getNativeTypeSize: function (type) {
    switch (type) {
      case 'i1': case 'i8': return 1;
      case 'i16': return 2;
      case 'i32': return 4;
      case 'i64': return 8;
      case 'float': return 4;
      case 'double': return 8;
      default: {
        if (type[type.length-1] === '*') {
          return Runtime.QUANTUM_SIZE; // A pointer
        } else if (type[0] === 'i') {
          var bits = parseInt(type.substr(1));
          assert(bits % 8 === 0);
          return bits/8;
        } else {
          return 0;
        }
      }
    }
  },
  getNativeFieldSize: function (type) {
    return Math.max(Runtime.getNativeTypeSize(type), Runtime.QUANTUM_SIZE);
  },
  STACK_ALIGN: 16,
  getAlignSize: function (type, size, vararg) {
    // we align i64s and doubles on 64-bit boundaries, unlike x86
    if (!vararg && (type == 'i64' || type == 'double')) return 8;
    if (!type) return Math.min(size, 8); // align structures internally to 64 bits
    return Math.min(size || (type ? Runtime.getNativeFieldSize(type) : 0), Runtime.QUANTUM_SIZE);
  },
  dynCall: function (sig, ptr, args) {
    if (args && args.length) {
      assert(args.length == sig.length-1);
      if (!args.splice) args = Array.prototype.slice.call(args);
      args.splice(0, 0, ptr);
      assert(('dynCall_' + sig) in Module, 'bad function pointer type - no table for sig \'' + sig + '\'');
      return Module['dynCall_' + sig].apply(null, args);
    } else {
      assert(sig.length == 1);
      assert(('dynCall_' + sig) in Module, 'bad function pointer type - no table for sig \'' + sig + '\'');
      return Module['dynCall_' + sig].call(null, ptr);
    }
  },
  functionPointers: [],
  addFunction: function (func) {
    for (var i = 0; i < Runtime.functionPointers.length; i++) {
      if (!Runtime.functionPointers[i]) {
        Runtime.functionPointers[i] = func;
        return 2*(1 + i);
      }
    }
    throw 'Finished up all reserved function pointers. Use a higher value for RESERVED_FUNCTION_POINTERS.';
  },
  removeFunction: function (index) {
    Runtime.functionPointers[(index-2)/2] = null;
  },
  getAsmConst: function (code, numArgs) {
    // code is a constant string on the heap, so we can cache these
    if (!Runtime.asmConstCache) Runtime.asmConstCache = {};
    var func = Runtime.asmConstCache[code];
    if (func) return func;
    var args = [];
    for (var i = 0; i < numArgs; i++) {
      args.push(String.fromCharCode(36) + i); // $0, $1 etc
    }
    var source = Pointer_stringify(code);
    if (source[0] === '"') {
      // tolerate EM_ASM("..code..") even though EM_ASM(..code..) is correct
      if (source.indexOf('"', 1) === source.length-1) {
        source = source.substr(1, source.length-2);
      } else {
        // something invalid happened, e.g. EM_ASM("..code($0)..", input)
        abort('invalid EM_ASM input |' + source + '|. Please use EM_ASM(..code..) (no quotes) or EM_ASM({ ..code($0).. }, input) (to input values)');
      }
    }
    try {
      // Module is the only 'upvar', which we provide directly. We also provide FS for legacy support.
      var evalled = eval('(function(Module, FS) { return function(' + args.join(',') + '){ ' + source + ' } })')(Module, typeof FS !== 'undefined' ? FS : null);
    } catch(e) {
      Module.printErr('error in executing inline EM_ASM code: ' + e + ' on: \n\n' + source + '\n\nwith args |' + args + '| (make sure to use the right one out of EM_ASM, EM_ASM_ARGS, etc.)');
      throw e;
    }
    return Runtime.asmConstCache[code] = evalled;
  },
  warnOnce: function (text) {
    if (!Runtime.warnOnce.shown) Runtime.warnOnce.shown = {};
    if (!Runtime.warnOnce.shown[text]) {
      Runtime.warnOnce.shown[text] = 1;
      Module.printErr(text);
    }
  },
  funcWrappers: {},
  getFuncWrapper: function (func, sig) {
    assert(sig);
    if (!Runtime.funcWrappers[sig]) {
      Runtime.funcWrappers[sig] = {};
    }
    var sigCache = Runtime.funcWrappers[sig];
    if (!sigCache[func]) {
      sigCache[func] = function dynCall_wrapper() {
        return Runtime.dynCall(sig, func, arguments);
      };
    }
    return sigCache[func];
  },
  getCompilerSetting: function (name) {
    throw 'You must build with -s RETAIN_COMPILER_SETTINGS=1 for Runtime.getCompilerSetting or emscripten_get_compiler_setting to work';
  },
  stackAlloc: function (size) { var ret = STACKTOP;STACKTOP = (STACKTOP + size)|0;STACKTOP = (((STACKTOP)+15)&-16);(assert((((STACKTOP|0) < (STACK_MAX|0))|0))|0); return ret; },
  staticAlloc: function (size) { var ret = STATICTOP;STATICTOP = (STATICTOP + (assert(!staticSealed),size))|0;STATICTOP = (((STATICTOP)+15)&-16); return ret; },
  dynamicAlloc: function (size) { var ret = DYNAMICTOP;DYNAMICTOP = (DYNAMICTOP + (assert(DYNAMICTOP > 0),size))|0;DYNAMICTOP = (((DYNAMICTOP)+15)&-16); if (DYNAMICTOP >= TOTAL_MEMORY) enlargeMemory();; return ret; },
  alignMemory: function (size,quantum) { var ret = size = Math.ceil((size)/(quantum ? quantum : 16))*(quantum ? quantum : 16); return ret; },
  makeBigInt: function (low,high,unsigned) { var ret = (unsigned ? ((+((low>>>0)))+((+((high>>>0)))*4294967296.0)) : ((+((low>>>0)))+((+((high|0)))*4294967296.0))); return ret; },
  GLOBAL_BASE: 8,
  QUANTUM_SIZE: 4,
  __dummy__: 0
}


Module['Runtime'] = Runtime;









//========================================
// Runtime essentials
//========================================

var __THREW__ = 0; // Used in checking for thrown exceptions.

var ABORT = false; // whether we are quitting the application. no code should run after this. set in exit() and abort()
var EXITSTATUS = 0;

var undef = 0;
// tempInt is used for 32-bit signed values or smaller. tempBigInt is used
// for 32-bit unsigned values or more than 32 bits. TODO: audit all uses of tempInt
var tempValue, tempInt, tempBigInt, tempInt2, tempBigInt2, tempPair, tempBigIntI, tempBigIntR, tempBigIntS, tempBigIntP, tempBigIntD, tempDouble, tempFloat;
var tempI64, tempI64b;
var tempRet0, tempRet1, tempRet2, tempRet3, tempRet4, tempRet5, tempRet6, tempRet7, tempRet8, tempRet9;

function assert(condition, text) {
  if (!condition) {
    abort('Assertion failed: ' + text);
  }
}

var globalScope = this;

// Returns the C function with a specified identifier (for C++, you need to do manual name mangling)
function getCFunc(ident) {
  var func = Module['_' + ident]; // closure exported function
  if (!func) {
    try {
      func = eval('_' + ident); // explicit lookup
    } catch(e) {}
  }
  assert(func, 'Cannot call unknown function ' + ident + ' (perhaps LLVM optimizations or closure removed it?)');
  return func;
}

var cwrap, ccall;
(function(){
  var JSfuncs = {
    // Helpers for cwrap -- it can't refer to Runtime directly because it might
    // be renamed by closure, instead it calls JSfuncs['stackSave'].body to find
    // out what the minified function name is.
    'stackSave': function() {
      Runtime.stackSave()
    },
    'stackRestore': function() {
      Runtime.stackRestore()
    },
    // type conversion from js to c
    'arrayToC' : function(arr) {
      var ret = Runtime.stackAlloc(arr.length);
      writeArrayToMemory(arr, ret);
      return ret;
    },
    'stringToC' : function(str) {
      var ret = 0;
      if (str !== null && str !== undefined && str !== 0) { // null string
        // at most 4 bytes per UTF-8 code point, +1 for the trailing '\0'
        ret = Runtime.stackAlloc((str.length << 2) + 1);
        writeStringToMemory(str, ret);
      }
      return ret;
    }
  };
  // For fast lookup of conversion functions
  var toC = {'string' : JSfuncs['stringToC'], 'array' : JSfuncs['arrayToC']};

  // C calling interface. 
  ccall = function ccallFunc(ident, returnType, argTypes, args) {
    var func = getCFunc(ident);
    var cArgs = [];
    var stack = 0;
    assert(returnType !== 'array', 'Return type should not be "array".');
    if (args) {
      for (var i = 0; i < args.length; i++) {
        var converter = toC[argTypes[i]];
        if (converter) {
          if (stack === 0) stack = Runtime.stackSave();
          cArgs[i] = converter(args[i]);
        } else {
          cArgs[i] = args[i];
        }
      }
    }
    var ret = func.apply(null, cArgs);
    if (returnType === 'string') ret = Pointer_stringify(ret);
    if (stack !== 0) Runtime.stackRestore(stack);
    return ret;
  }

  var sourceRegex = /^function\s*\(([^)]*)\)\s*{\s*([^*]*?)[\s;]*(?:return\s*(.*?)[;\s]*)?}$/;
  function parseJSFunc(jsfunc) {
    // Match the body and the return value of a javascript function source
    var parsed = jsfunc.toString().match(sourceRegex).slice(1);
    return {arguments : parsed[0], body : parsed[1], returnValue: parsed[2]}
  }
  var JSsource = {};
  for (var fun in JSfuncs) {
    if (JSfuncs.hasOwnProperty(fun)) {
      // Elements of toCsource are arrays of three items:
      // the code, and the return value
      JSsource[fun] = parseJSFunc(JSfuncs[fun]);
    }
  }

  
  cwrap = function cwrap(ident, returnType, argTypes) {
    argTypes = argTypes || [];
    var cfunc = getCFunc(ident);
    // When the function takes numbers and returns a number, we can just return
    // the original function
    var numericArgs = argTypes.every(function(type){ return type === 'number'});
    var numericRet = (returnType !== 'string');
    if ( numericRet && numericArgs) {
      return cfunc;
    }
    // Creation of the arguments list (["$1","$2",...,"$nargs"])
    var argNames = argTypes.map(function(x,i){return '$'+i});
    var funcstr = "(function(" + argNames.join(',') + ") {";
    var nargs = argTypes.length;
    if (!numericArgs) {
      // Generate the code needed to convert the arguments from javascript
      // values to pointers
      funcstr += 'var stack = ' + JSsource['stackSave'].body + ';';
      for (var i = 0; i < nargs; i++) {
        var arg = argNames[i], type = argTypes[i];
        if (type === 'number') continue;
        var convertCode = JSsource[type + 'ToC']; // [code, return]
        funcstr += 'var ' + convertCode.arguments + ' = ' + arg + ';';
        funcstr += convertCode.body + ';';
        funcstr += arg + '=' + convertCode.returnValue + ';';
      }
    }

    // When the code is compressed, the name of cfunc is not literally 'cfunc' anymore
    var cfuncname = parseJSFunc(function(){return cfunc}).returnValue;
    // Call the function
    funcstr += 'var ret = ' + cfuncname + '(' + argNames.join(',') + ');';
    if (!numericRet) { // Return type can only by 'string' or 'number'
      // Convert the result to a string
      var strgfy = parseJSFunc(function(){return Pointer_stringify}).returnValue;
      funcstr += 'ret = ' + strgfy + '(ret);';
    }
    if (!numericArgs) {
      // If we had a stack, restore it
      funcstr += JSsource['stackRestore'].body.replace('()', '(stack)') + ';';
    }
    funcstr += 'return ret})';
    return eval(funcstr);
  };
})();
Module["cwrap"] = cwrap;
Module["ccall"] = ccall;


function setValue(ptr, value, type, noSafe) {
  type = type || 'i8';
  if (type.charAt(type.length-1) === '*') type = 'i32'; // pointers are 32-bit
    switch(type) {
      case 'i1': HEAP8[((ptr)>>0)]=value; break;
      case 'i8': HEAP8[((ptr)>>0)]=value; break;
      case 'i16': HEAP16[((ptr)>>1)]=value; break;
      case 'i32': HEAP32[((ptr)>>2)]=value; break;
      case 'i64': (tempI64 = [value>>>0,(tempDouble=value,(+(Math_abs(tempDouble))) >= 1.0 ? (tempDouble > 0.0 ? ((Math_min((+(Math_floor((tempDouble)/4294967296.0))), 4294967295.0))|0)>>>0 : (~~((+(Math_ceil((tempDouble - +(((~~(tempDouble)))>>>0))/4294967296.0)))))>>>0) : 0)],HEAP32[((ptr)>>2)]=tempI64[0],HEAP32[(((ptr)+(4))>>2)]=tempI64[1]); break;
      case 'float': HEAPF32[((ptr)>>2)]=value; break;
      case 'double': HEAPF64[((ptr)>>3)]=value; break;
      default: abort('invalid type for setValue: ' + type);
    }
}
Module['setValue'] = setValue;


function getValue(ptr, type, noSafe) {
  type = type || 'i8';
  if (type.charAt(type.length-1) === '*') type = 'i32'; // pointers are 32-bit
    switch(type) {
      case 'i1': return HEAP8[((ptr)>>0)];
      case 'i8': return HEAP8[((ptr)>>0)];
      case 'i16': return HEAP16[((ptr)>>1)];
      case 'i32': return HEAP32[((ptr)>>2)];
      case 'i64': return HEAP32[((ptr)>>2)];
      case 'float': return HEAPF32[((ptr)>>2)];
      case 'double': return HEAPF64[((ptr)>>3)];
      default: abort('invalid type for setValue: ' + type);
    }
  return null;
}
Module['getValue'] = getValue;

var ALLOC_NORMAL = 0; // Tries to use _malloc()
var ALLOC_STACK = 1; // Lives for the duration of the current function call
var ALLOC_STATIC = 2; // Cannot be freed
var ALLOC_DYNAMIC = 3; // Cannot be freed except through sbrk
var ALLOC_NONE = 4; // Do not allocate
Module['ALLOC_NORMAL'] = ALLOC_NORMAL;
Module['ALLOC_STACK'] = ALLOC_STACK;
Module['ALLOC_STATIC'] = ALLOC_STATIC;
Module['ALLOC_DYNAMIC'] = ALLOC_DYNAMIC;
Module['ALLOC_NONE'] = ALLOC_NONE;

// allocate(): This is for internal use. You can use it yourself as well, but the interface
//             is a little tricky (see docs right below). The reason is that it is optimized
//             for multiple syntaxes to save space in generated code. So you should
//             normally not use allocate(), and instead allocate memory using _malloc(),
//             initialize it with setValue(), and so forth.
// @slab: An array of data, or a number. If a number, then the size of the block to allocate,
//        in *bytes* (note that this is sometimes confusing: the next parameter does not
//        affect this!)
// @types: Either an array of types, one for each byte (or 0 if no type at that position),
//         or a single type which is used for the entire block. This only matters if there
//         is initial data - if @slab is a number, then this does not matter at all and is
//         ignored.
// @allocator: How to allocate memory, see ALLOC_*
function allocate(slab, types, allocator, ptr) {
  var zeroinit, size;
  if (typeof slab === 'number') {
    zeroinit = true;
    size = slab;
  } else {
    zeroinit = false;
    size = slab.length;
  }

  var singleType = typeof types === 'string' ? types : null;

  var ret;
  if (allocator == ALLOC_NONE) {
    ret = ptr;
  } else {
    ret = [_malloc, Runtime.stackAlloc, Runtime.staticAlloc, Runtime.dynamicAlloc][allocator === undefined ? ALLOC_STATIC : allocator](Math.max(size, singleType ? 1 : types.length));
  }

  if (zeroinit) {
    var ptr = ret, stop;
    assert((ret & 3) == 0);
    stop = ret + (size & ~3);
    for (; ptr < stop; ptr += 4) {
      HEAP32[((ptr)>>2)]=0;
    }
    stop = ret + size;
    while (ptr < stop) {
      HEAP8[((ptr++)>>0)]=0;
    }
    return ret;
  }

  if (singleType === 'i8') {
    if (slab.subarray || slab.slice) {
      HEAPU8.set(slab, ret);
    } else {
      HEAPU8.set(new Uint8Array(slab), ret);
    }
    return ret;
  }

  var i = 0, type, typeSize, previousType;
  while (i < size) {
    var curr = slab[i];

    if (typeof curr === 'function') {
      curr = Runtime.getFunctionIndex(curr);
    }

    type = singleType || types[i];
    if (type === 0) {
      i++;
      continue;
    }
    assert(type, 'Must know what type to store in allocate!');

    if (type == 'i64') type = 'i32'; // special case: we have one i32 here, and one i32 later

    setValue(ret+i, curr, type);

    // no need to look up size unless type changes, so cache it
    if (previousType !== type) {
      typeSize = Runtime.getNativeTypeSize(type);
      previousType = type;
    }
    i += typeSize;
  }

  return ret;
}
Module['allocate'] = allocate;

function Pointer_stringify(ptr, /* optional */ length) {
  if (length === 0 || !ptr) return '';
  // TODO: use TextDecoder
  // Find the length, and check for UTF while doing so
  var hasUtf = 0;
  var t;
  var i = 0;
  while (1) {
    assert(ptr + i < TOTAL_MEMORY);
    t = HEAPU8[(((ptr)+(i))>>0)];
    hasUtf |= t;
    if (t == 0 && !length) break;
    i++;
    if (length && i == length) break;
  }
  if (!length) length = i;

  var ret = '';

  if (hasUtf < 128) {
    var MAX_CHUNK = 1024; // split up into chunks, because .apply on a huge string can overflow the stack
    var curr;
    while (length > 0) {
      curr = String.fromCharCode.apply(String, HEAPU8.subarray(ptr, ptr + Math.min(length, MAX_CHUNK)));
      ret = ret ? ret + curr : curr;
      ptr += MAX_CHUNK;
      length -= MAX_CHUNK;
    }
    return ret;
  }
  return Module['UTF8ToString'](ptr);
}
Module['Pointer_stringify'] = Pointer_stringify;

// Given a pointer 'ptr' to a null-terminated ASCII-encoded string in the emscripten HEAP, returns
// a copy of that string as a Javascript String object.

function AsciiToString(ptr) {
  var str = '';
  while (1) {
    var ch = HEAP8[((ptr++)>>0)];
    if (!ch) return str;
    str += String.fromCharCode(ch);
  }
}
Module['AsciiToString'] = AsciiToString;

// Copies the given Javascript String object 'str' to the emscripten HEAP at address 'outPtr',
// null-terminated and encoded in ASCII form. The copy will require at most str.length+1 bytes of space in the HEAP.

function stringToAscii(str, outPtr) {
  return writeAsciiToMemory(str, outPtr, false);
}
Module['stringToAscii'] = stringToAscii;

// Given a pointer 'ptr' to a null-terminated UTF8-encoded string in the a given array that contains uint8 values, returns
// a copy of that string as a Javascript String object.

function UTF8ArrayToString(u8Array, idx) {
  var u0, u1, u2, u3, u4, u5;

  var str = '';
  while (1) {
    // For UTF8 byte structure, see http://en.wikipedia.org/wiki/UTF-8#Description and https://www.ietf.org/rfc/rfc2279.txt and https://tools.ietf.org/html/rfc3629
    u0 = u8Array[idx++];
    if (!u0) return str;
    if (!(u0 & 0x80)) { str += String.fromCharCode(u0); continue; }
    u1 = u8Array[idx++] & 63;
    if ((u0 & 0xE0) == 0xC0) { str += String.fromCharCode(((u0 & 31) << 6) | u1); continue; }
    u2 = u8Array[idx++] & 63;
    if ((u0 & 0xF0) == 0xE0) {
      u0 = ((u0 & 15) << 12) | (u1 << 6) | u2;
    } else {
      u3 = u8Array[idx++] & 63;
      if ((u0 & 0xF8) == 0xF0) {
        u0 = ((u0 & 7) << 18) | (u1 << 12) | (u2 << 6) | u3;
      } else {
        u4 = u8Array[idx++] & 63;
        if ((u0 & 0xFC) == 0xF8) {
          u0 = ((u0 & 3) << 24) | (u1 << 18) | (u2 << 12) | (u3 << 6) | u4;
        } else {
          u5 = u8Array[idx++] & 63;
          u0 = ((u0 & 1) << 30) | (u1 << 24) | (u2 << 18) | (u3 << 12) | (u4 << 6) | u5;
        }
      }
    }
    if (u0 < 0x10000) {
      str += String.fromCharCode(u0);
    } else {
      var ch = u0 - 0x10000;
      str += String.fromCharCode(0xD800 | (ch >> 10), 0xDC00 | (ch & 0x3FF));
    }
  }
}
Module['UTF8ArrayToString'] = UTF8ArrayToString;

// Given a pointer 'ptr' to a null-terminated UTF8-encoded string in the emscripten HEAP, returns
// a copy of that string as a Javascript String object.

function UTF8ToString(ptr) {
  return UTF8ArrayToString(HEAPU8, ptr);
}
Module['UTF8ToString'] = UTF8ToString;

// Copies the given Javascript String object 'str' to the given byte array at address 'outIdx',
// encoded in UTF8 form and null-terminated. The copy will require at most str.length*4+1 bytes of space in the HEAP.
// Use the function lengthBytesUTF8() to compute the exact number of bytes (excluding null terminator) that this function will write.
// Parameters:
//   str: the Javascript string to copy.
//   outU8Array: the array to copy to. Each index in this array is assumed to be one 8-byte element.
//   outIdx: The starting offset in the array to begin the copying.
//   maxBytesToWrite: The maximum number of bytes this function can write to the array. This count should include the null 
//                    terminator, i.e. if maxBytesToWrite=1, only the null terminator will be written and nothing else.
//                    maxBytesToWrite=0 does not write any bytes to the output, not even the null terminator.
// Returns the number of bytes written, EXCLUDING the null terminator.

function stringToUTF8Array(str, outU8Array, outIdx, maxBytesToWrite) {
  if (!(maxBytesToWrite > 0)) // Parameter maxBytesToWrite is not optional. Negative values, 0, null, undefined and false each don't write out any bytes.
    return 0;

  var startIdx = outIdx;
  var endIdx = outIdx + maxBytesToWrite - 1; // -1 for string null terminator.
  for (var i = 0; i < str.length; ++i) {
    // Gotcha: charCodeAt returns a 16-bit word that is a UTF-16 encoded code unit, not a Unicode code point of the character! So decode UTF16->UTF32->UTF8.
    // See http://unicode.org/faq/utf_bom.html#utf16-3
    // For UTF8 byte structure, see http://en.wikipedia.org/wiki/UTF-8#Description and https://www.ietf.org/rfc/rfc2279.txt and https://tools.ietf.org/html/rfc3629
    var u = str.charCodeAt(i); // possibly a lead surrogate
    if (u >= 0xD800 && u <= 0xDFFF) u = 0x10000 + ((u & 0x3FF) << 10) | (str.charCodeAt(++i) & 0x3FF);
    if (u <= 0x7F) {
      if (outIdx >= endIdx) break;
      outU8Array[outIdx++] = u;
    } else if (u <= 0x7FF) {
      if (outIdx + 1 >= endIdx) break;
      outU8Array[outIdx++] = 0xC0 | (u >> 6);
      outU8Array[outIdx++] = 0x80 | (u & 63);
    } else if (u <= 0xFFFF) {
      if (outIdx + 2 >= endIdx) break;
      outU8Array[outIdx++] = 0xE0 | (u >> 12);
      outU8Array[outIdx++] = 0x80 | ((u >> 6) & 63);
      outU8Array[outIdx++] = 0x80 | (u & 63);
    } else if (u <= 0x1FFFFF) {
      if (outIdx + 3 >= endIdx) break;
      outU8Array[outIdx++] = 0xF0 | (u >> 18);
      outU8Array[outIdx++] = 0x80 | ((u >> 12) & 63);
      outU8Array[outIdx++] = 0x80 | ((u >> 6) & 63);
      outU8Array[outIdx++] = 0x80 | (u & 63);
    } else if (u <= 0x3FFFFFF) {
      if (outIdx + 4 >= endIdx) break;
      outU8Array[outIdx++] = 0xF8 | (u >> 24);
      outU8Array[outIdx++] = 0x80 | ((u >> 18) & 63);
      outU8Array[outIdx++] = 0x80 | ((u >> 12) & 63);
      outU8Array[outIdx++] = 0x80 | ((u >> 6) & 63);
      outU8Array[outIdx++] = 0x80 | (u & 63);
    } else {
      if (outIdx + 5 >= endIdx) break;
      outU8Array[outIdx++] = 0xFC | (u >> 30);
      outU8Array[outIdx++] = 0x80 | ((u >> 24) & 63);
      outU8Array[outIdx++] = 0x80 | ((u >> 18) & 63);
      outU8Array[outIdx++] = 0x80 | ((u >> 12) & 63);
      outU8Array[outIdx++] = 0x80 | ((u >> 6) & 63);
      outU8Array[outIdx++] = 0x80 | (u & 63);
    }
  }
  // Null-terminate the pointer to the buffer.
  outU8Array[outIdx] = 0;
  return outIdx - startIdx;
}
Module['stringToUTF8Array'] = stringToUTF8Array;

// Copies the given Javascript String object 'str' to the emscripten HEAP at address 'outPtr',
// null-terminated and encoded in UTF8 form. The copy will require at most str.length*4+1 bytes of space in the HEAP.
// Use the function lengthBytesUTF8() to compute the exact number of bytes (excluding null terminator) that this function will write.
// Returns the number of bytes written, EXCLUDING the null terminator.

function stringToUTF8(str, outPtr, maxBytesToWrite) {
  assert(typeof maxBytesToWrite == 'number', 'stringToUTF8(str, outPtr, maxBytesToWrite) is missing the third parameter that specifies the length of the output buffer!');
  return stringToUTF8Array(str, HEAPU8, outPtr, maxBytesToWrite);
}
Module['stringToUTF8'] = stringToUTF8;

// Returns the number of bytes the given Javascript string takes if encoded as a UTF8 byte array, EXCLUDING the null terminator byte.

function lengthBytesUTF8(str) {
  var len = 0;
  for (var i = 0; i < str.length; ++i) {
    // Gotcha: charCodeAt returns a 16-bit word that is a UTF-16 encoded code unit, not a Unicode code point of the character! So decode UTF16->UTF32->UTF8.
    // See http://unicode.org/faq/utf_bom.html#utf16-3
    var u = str.charCodeAt(i); // possibly a lead surrogate
    if (u >= 0xD800 && u <= 0xDFFF) u = 0x10000 + ((u & 0x3FF) << 10) | (str.charCodeAt(++i) & 0x3FF);
    if (u <= 0x7F) {
      ++len;
    } else if (u <= 0x7FF) {
      len += 2;
    } else if (u <= 0xFFFF) {
      len += 3;
    } else if (u <= 0x1FFFFF) {
      len += 4;
    } else if (u <= 0x3FFFFFF) {
      len += 5;
    } else {
      len += 6;
    }
  }
  return len;
}
Module['lengthBytesUTF8'] = lengthBytesUTF8;

// Given a pointer 'ptr' to a null-terminated UTF16LE-encoded string in the emscripten HEAP, returns
// a copy of that string as a Javascript String object.

function UTF16ToString(ptr) {
  var i = 0;

  var str = '';
  while (1) {
    var codeUnit = HEAP16[(((ptr)+(i*2))>>1)];
    if (codeUnit == 0)
      return str;
    ++i;
    // fromCharCode constructs a character from a UTF-16 code unit, so we can pass the UTF16 string right through.
    str += String.fromCharCode(codeUnit);
  }
}
Module['UTF16ToString'] = UTF16ToString;

// Copies the given Javascript String object 'str' to the emscripten HEAP at address 'outPtr',
// null-terminated and encoded in UTF16 form. The copy will require at most str.length*4+2 bytes of space in the HEAP.
// Use the function lengthBytesUTF16() to compute the exact number of bytes (excluding null terminator) that this function will write.
// Parameters:
//   str: the Javascript string to copy.
//   outPtr: Byte address in Emscripten HEAP where to write the string to.
//   maxBytesToWrite: The maximum number of bytes this function can write to the array. This count should include the null 
//                    terminator, i.e. if maxBytesToWrite=2, only the null terminator will be written and nothing else.
//                    maxBytesToWrite<2 does not write any bytes to the output, not even the null terminator.
// Returns the number of bytes written, EXCLUDING the null terminator.

function stringToUTF16(str, outPtr, maxBytesToWrite) {
  assert(typeof maxBytesToWrite == 'number', 'stringToUTF16(str, outPtr, maxBytesToWrite) is missing the third parameter that specifies the length of the output buffer!');
  // Backwards compatibility: if max bytes is not specified, assume unsafe unbounded write is allowed.
  if (maxBytesToWrite === undefined) {
    maxBytesToWrite = 0x7FFFFFFF;
  }
  if (maxBytesToWrite < 2) return 0;
  maxBytesToWrite -= 2; // Null terminator.
  var startPtr = outPtr;
  var numCharsToWrite = (maxBytesToWrite < str.length*2) ? (maxBytesToWrite / 2) : str.length;
  for (var i = 0; i < numCharsToWrite; ++i) {
    // charCodeAt returns a UTF-16 encoded code unit, so it can be directly written to the HEAP.
    var codeUnit = str.charCodeAt(i); // possibly a lead surrogate
    HEAP16[((outPtr)>>1)]=codeUnit;
    outPtr += 2;
  }
  // Null-terminate the pointer to the HEAP.
  HEAP16[((outPtr)>>1)]=0;
  return outPtr - startPtr;
}
Module['stringToUTF16'] = stringToUTF16;

// Returns the number of bytes the given Javascript string takes if encoded as a UTF16 byte array, EXCLUDING the null terminator byte.

function lengthBytesUTF16(str) {
  return str.length*2;
}
Module['lengthBytesUTF16'] = lengthBytesUTF16;

function UTF32ToString(ptr) {
  var i = 0;

  var str = '';
  while (1) {
    var utf32 = HEAP32[(((ptr)+(i*4))>>2)];
    if (utf32 == 0)
      return str;
    ++i;
    // Gotcha: fromCharCode constructs a character from a UTF-16 encoded code (pair), not from a Unicode code point! So encode the code point to UTF-16 for constructing.
    // See http://unicode.org/faq/utf_bom.html#utf16-3
    if (utf32 >= 0x10000) {
      var ch = utf32 - 0x10000;
      str += String.fromCharCode(0xD800 | (ch >> 10), 0xDC00 | (ch & 0x3FF));
    } else {
      str += String.fromCharCode(utf32);
    }
  }
}
Module['UTF32ToString'] = UTF32ToString;

// Copies the given Javascript String object 'str' to the emscripten HEAP at address 'outPtr',
// null-terminated and encoded in UTF32 form. The copy will require at most str.length*4+4 bytes of space in the HEAP.
// Use the function lengthBytesUTF32() to compute the exact number of bytes (excluding null terminator) that this function will write.
// Parameters:
//   str: the Javascript string to copy.
//   outPtr: Byte address in Emscripten HEAP where to write the string to.
//   maxBytesToWrite: The maximum number of bytes this function can write to the array. This count should include the null 
//                    terminator, i.e. if maxBytesToWrite=4, only the null terminator will be written and nothing else.
//                    maxBytesToWrite<4 does not write any bytes to the output, not even the null terminator.
// Returns the number of bytes written, EXCLUDING the null terminator.

function stringToUTF32(str, outPtr, maxBytesToWrite) {
  assert(typeof maxBytesToWrite == 'number', 'stringToUTF32(str, outPtr, maxBytesToWrite) is missing the third parameter that specifies the length of the output buffer!');
  // Backwards compatibility: if max bytes is not specified, assume unsafe unbounded write is allowed.
  if (maxBytesToWrite === undefined) {
    maxBytesToWrite = 0x7FFFFFFF;
  }
  if (maxBytesToWrite < 4) return 0;
  var startPtr = outPtr;
  var endPtr = startPtr + maxBytesToWrite - 4;
  for (var i = 0; i < str.length; ++i) {
    // Gotcha: charCodeAt returns a 16-bit word that is a UTF-16 encoded code unit, not a Unicode code point of the character! We must decode the string to UTF-32 to the heap.
    // See http://unicode.org/faq/utf_bom.html#utf16-3
    var codeUnit = str.charCodeAt(i); // possibly a lead surrogate
    if (codeUnit >= 0xD800 && codeUnit <= 0xDFFF) {
      var trailSurrogate = str.charCodeAt(++i);
      codeUnit = 0x10000 + ((codeUnit & 0x3FF) << 10) | (trailSurrogate & 0x3FF);
    }
    HEAP32[((outPtr)>>2)]=codeUnit;
    outPtr += 4;
    if (outPtr + 4 > endPtr) break;
  }
  // Null-terminate the pointer to the HEAP.
  HEAP32[((outPtr)>>2)]=0;
  return outPtr - startPtr;
}
Module['stringToUTF32'] = stringToUTF32;

// Returns the number of bytes the given Javascript string takes if encoded as a UTF16 byte array, EXCLUDING the null terminator byte.

function lengthBytesUTF32(str) {
  var len = 0;
  for (var i = 0; i < str.length; ++i) {
    // Gotcha: charCodeAt returns a 16-bit word that is a UTF-16 encoded code unit, not a Unicode code point of the character! We must decode the string to UTF-32 to the heap.
    // See http://unicode.org/faq/utf_bom.html#utf16-3
    var codeUnit = str.charCodeAt(i);
    if (codeUnit >= 0xD800 && codeUnit <= 0xDFFF) ++i; // possibly a lead surrogate, so skip over the tail surrogate.
    len += 4;
  }

  return len;
}
Module['lengthBytesUTF32'] = lengthBytesUTF32;

function demangle(func) {
  var hasLibcxxabi = !!Module['___cxa_demangle'];
  if (hasLibcxxabi) {
    try {
      var buf = _malloc(func.length);
      writeStringToMemory(func.substr(1), buf);
      var status = _malloc(4);
      var ret = Module['___cxa_demangle'](buf, 0, 0, status);
      if (getValue(status, 'i32') === 0 && ret) {
        return Pointer_stringify(ret);
      }
      // otherwise, libcxxabi failed, we can try ours which may return a partial result
    } catch(e) {
      // failure when using libcxxabi, we can try ours which may return a partial result
    } finally {
      if (buf) _free(buf);
      if (status) _free(status);
      if (ret) _free(ret);
    }
  }
  var i = 3;
  // params, etc.
  var basicTypes = {
    'v': 'void',
    'b': 'bool',
    'c': 'char',
    's': 'short',
    'i': 'int',
    'l': 'long',
    'f': 'float',
    'd': 'double',
    'w': 'wchar_t',
    'a': 'signed char',
    'h': 'unsigned char',
    't': 'unsigned short',
    'j': 'unsigned int',
    'm': 'unsigned long',
    'x': 'long long',
    'y': 'unsigned long long',
    'z': '...'
  };
  var subs = [];
  var first = true;
  function dump(x) {
    //return;
    if (x) Module.print(x);
    Module.print(func);
    var pre = '';
    for (var a = 0; a < i; a++) pre += ' ';
    Module.print (pre + '^');
  }
  function parseNested() {
    i++;
    if (func[i] === 'K') i++; // ignore const
    var parts = [];
    while (func[i] !== 'E') {
      if (func[i] === 'S') { // substitution
        i++;
        var next = func.indexOf('_', i);
        var num = func.substring(i, next) || 0;
        parts.push(subs[num] || '?');
        i = next+1;
        continue;
      }
      if (func[i] === 'C') { // constructor
        parts.push(parts[parts.length-1]);
        i += 2;
        continue;
      }
      var size = parseInt(func.substr(i));
      var pre = size.toString().length;
      if (!size || !pre) { i--; break; } // counter i++ below us
      var curr = func.substr(i + pre, size);
      parts.push(curr);
      subs.push(curr);
      i += pre + size;
    }
    i++; // skip E
    return parts;
  }
  function parse(rawList, limit, allowVoid) { // main parser
    limit = limit || Infinity;
    var ret = '', list = [];
    function flushList() {
      return '(' + list.join(', ') + ')';
    }
    var name;
    if (func[i] === 'N') {
      // namespaced N-E
      name = parseNested().join('::');
      limit--;
      if (limit === 0) return rawList ? [name] : name;
    } else {
      // not namespaced
      if (func[i] === 'K' || (first && func[i] === 'L')) i++; // ignore const and first 'L'
      var size = parseInt(func.substr(i));
      if (size) {
        var pre = size.toString().length;
        name = func.substr(i + pre, size);
        i += pre + size;
      }
    }
    first = false;
    if (func[i] === 'I') {
      i++;
      var iList = parse(true);
      var iRet = parse(true, 1, true);
      ret += iRet[0] + ' ' + name + '<' + iList.join(', ') + '>';
    } else {
      ret = name;
    }
    paramLoop: while (i < func.length && limit-- > 0) {
      //dump('paramLoop');
      var c = func[i++];
      if (c in basicTypes) {
        list.push(basicTypes[c]);
      } else {
        switch (c) {
          case 'P': list.push(parse(true, 1, true)[0] + '*'); break; // pointer
          case 'R': list.push(parse(true, 1, true)[0] + '&'); break; // reference
          case 'L': { // literal
            i++; // skip basic type
            var end = func.indexOf('E', i);
            var size = end - i;
            list.push(func.substr(i, size));
            i += size + 2; // size + 'EE'
            break;
          }
          case 'A': { // array
            var size = parseInt(func.substr(i));
            i += size.toString().length;
            if (func[i] !== '_') throw '?';
            i++; // skip _
            list.push(parse(true, 1, true)[0] + ' [' + size + ']');
            break;
          }
          case 'E': break paramLoop;
          default: ret += '?' + c; break paramLoop;
        }
      }
    }
    if (!allowVoid && list.length === 1 && list[0] === 'void') list = []; // avoid (void)
    if (rawList) {
      if (ret) {
        list.push(ret + '?');
      }
      return list;
    } else {
      return ret + flushList();
    }
  }
  var parsed = func;
  try {
    // Special-case the entry point, since its name differs from other name mangling.
    if (func == 'Object._main' || func == '_main') {
      return 'main()';
    }
    if (typeof func === 'number') func = Pointer_stringify(func);
    if (func[0] !== '_') return func;
    if (func[1] !== '_') return func; // C function
    if (func[2] !== 'Z') return func;
    switch (func[3]) {
      case 'n': return 'operator new()';
      case 'd': return 'operator delete()';
    }
    parsed = parse();
  } catch(e) {
    parsed += '?';
  }
  if (parsed.indexOf('?') >= 0 && !hasLibcxxabi) {
    Runtime.warnOnce('warning: a problem occurred in builtin C++ name demangling; build with  -s DEMANGLE_SUPPORT=1  to link in libcxxabi demangling');
  }
  return parsed;
}

function demangleAll(text) {
  return text.replace(/__Z[\w\d_]+/g, function(x) { var y = demangle(x); return x === y ? x : (x + ' [' + y + ']') });
}

function jsStackTrace() {
  var err = new Error();
  if (!err.stack) {
    // IE10+ special cases: It does have callstack info, but it is only populated if an Error object is thrown,
    // so try that as a special-case.
    try {
      throw new Error(0);
    } catch(e) {
      err = e;
    }
    if (!err.stack) {
      return '(no stack trace available)';
    }
  }
  return err.stack.toString();
}

function stackTrace() {
  return demangleAll(jsStackTrace());
}
Module['stackTrace'] = stackTrace;

// Memory management

var PAGE_SIZE = 4096;
function alignMemoryPage(x) {
  return (x+4095)&-4096;
}

var HEAP;
var HEAP8, HEAPU8, HEAP16, HEAPU16, HEAP32, HEAPU32, HEAPF32, HEAPF64;

var STATIC_BASE = 0, STATICTOP = 0, staticSealed = false; // static area
var STACK_BASE = 0, STACKTOP = 0, STACK_MAX = 0; // stack area
var DYNAMIC_BASE = 0, DYNAMICTOP = 0; // dynamic area handled by sbrk

function enlargeMemory() {
  abort('Cannot enlarge memory arrays. Either (1) compile with -s TOTAL_MEMORY=X with X higher than the current value ' + TOTAL_MEMORY + ', (2) compile with ALLOW_MEMORY_GROWTH which adjusts the size at runtime but prevents some optimizations, or (3) set Module.TOTAL_MEMORY before the program runs.');
}


var TOTAL_STACK = Module['TOTAL_STACK'] || 5242880;
var TOTAL_MEMORY = Module['TOTAL_MEMORY'] || 16777216;
var FAST_MEMORY = Module['FAST_MEMORY'] || 2097152;

var totalMemory = 64*1024;
while (totalMemory < TOTAL_MEMORY || totalMemory < 2*TOTAL_STACK) {
  if (totalMemory < 16*1024*1024) {
    totalMemory *= 2;
  } else {
    totalMemory += 16*1024*1024
  }
}
if (totalMemory !== TOTAL_MEMORY) {
  Module.printErr('increasing TOTAL_MEMORY to ' + totalMemory + ' to be compliant with the asm.js spec (and given that TOTAL_STACK=' + TOTAL_STACK + ')');
  TOTAL_MEMORY = totalMemory;
}

// Initialize the runtime's memory
// check for full engine support (use string 'subarray' to avoid closure compiler confusion)
assert(typeof Int32Array !== 'undefined' && typeof Float64Array !== 'undefined' && !!(new Int32Array(1)['subarray']) && !!(new Int32Array(1)['set']),
       'JS engine does not provide full typed array support');

var buffer = new ArrayBuffer(TOTAL_MEMORY);
HEAP8 = new Int8Array(buffer);
HEAP16 = new Int16Array(buffer);
HEAP32 = new Int32Array(buffer);
HEAPU8 = new Uint8Array(buffer);
HEAPU16 = new Uint16Array(buffer);
HEAPU32 = new Uint32Array(buffer);
HEAPF32 = new Float32Array(buffer);
HEAPF64 = new Float64Array(buffer);

// Endianness check (note: assumes compiler arch was little-endian)
HEAP32[0] = 255;
assert(HEAPU8[0] === 255 && HEAPU8[3] === 0, 'Typed arrays 2 must be run on a little-endian system');

Module['HEAP'] = HEAP;
Module['buffer'] = buffer;
Module['HEAP8'] = HEAP8;
Module['HEAP16'] = HEAP16;
Module['HEAP32'] = HEAP32;
Module['HEAPU8'] = HEAPU8;
Module['HEAPU16'] = HEAPU16;
Module['HEAPU32'] = HEAPU32;
Module['HEAPF32'] = HEAPF32;
Module['HEAPF64'] = HEAPF64;

function callRuntimeCallbacks(callbacks) {
  while(callbacks.length > 0) {
    var callback = callbacks.shift();
    if (typeof callback == 'function') {
      callback();
      continue;
    }
    var func = callback.func;
    if (typeof func === 'number') {
      if (callback.arg === undefined) {
        Runtime.dynCall('v', func);
      } else {
        Runtime.dynCall('vi', func, [callback.arg]);
      }
    } else {
      func(callback.arg === undefined ? null : callback.arg);
    }
  }
}

var __ATPRERUN__  = []; // functions called before the runtime is initialized
var __ATINIT__    = []; // functions called during startup
var __ATMAIN__    = []; // functions called when main() is to be run
var __ATEXIT__    = []; // functions called during shutdown
var __ATPOSTRUN__ = []; // functions called after the runtime has exited

var runtimeInitialized = false;
var runtimeExited = false;

function preRun() {
  // compatibility - merge in anything from Module['preRun'] at this time
  if (Module['preRun']) {
    if (typeof Module['preRun'] == 'function') Module['preRun'] = [Module['preRun']];
    while (Module['preRun'].length) {
      addOnPreRun(Module['preRun'].shift());
    }
  }
  callRuntimeCallbacks(__ATPRERUN__);
}

function ensureInitRuntime() {
  if (runtimeInitialized) return;
  runtimeInitialized = true;
  callRuntimeCallbacks(__ATINIT__);
}

function preMain() {
  callRuntimeCallbacks(__ATMAIN__);
}

function exitRuntime() {
  callRuntimeCallbacks(__ATEXIT__);
  runtimeExited = true;
}

function postRun() {
  // compatibility - merge in anything from Module['postRun'] at this time
  if (Module['postRun']) {
    if (typeof Module['postRun'] == 'function') Module['postRun'] = [Module['postRun']];
    while (Module['postRun'].length) {
      addOnPostRun(Module['postRun'].shift());
    }
  }
  callRuntimeCallbacks(__ATPOSTRUN__);
}

function addOnPreRun(cb) {
  __ATPRERUN__.unshift(cb);
}
Module['addOnPreRun'] = Module.addOnPreRun = addOnPreRun;

function addOnInit(cb) {
  __ATINIT__.unshift(cb);
}
Module['addOnInit'] = Module.addOnInit = addOnInit;

function addOnPreMain(cb) {
  __ATMAIN__.unshift(cb);
}
Module['addOnPreMain'] = Module.addOnPreMain = addOnPreMain;

function addOnExit(cb) {
  __ATEXIT__.unshift(cb);
}
Module['addOnExit'] = Module.addOnExit = addOnExit;

function addOnPostRun(cb) {
  __ATPOSTRUN__.unshift(cb);
}
Module['addOnPostRun'] = Module.addOnPostRun = addOnPostRun;

// Tools


function intArrayFromString(stringy, dontAddNull, length /* optional */) {
  var len = length > 0 ? length : lengthBytesUTF8(stringy)+1;
  var u8array = new Array(len);
  var numBytesWritten = stringToUTF8Array(stringy, u8array, 0, u8array.length);
  if (dontAddNull) u8array.length = numBytesWritten;
  return u8array;
}
Module['intArrayFromString'] = intArrayFromString;

function intArrayToString(array) {
  var ret = [];
  for (var i = 0; i < array.length; i++) {
    var chr = array[i];
    if (chr > 0xFF) {
        assert(false, 'Character code ' + chr + ' (' + String.fromCharCode(chr) + ')  at offset ' + i + ' not in 0x00-0xFF.');
      chr &= 0xFF;
    }
    ret.push(String.fromCharCode(chr));
  }
  return ret.join('');
}
Module['intArrayToString'] = intArrayToString;

function writeStringToMemory(string, buffer, dontAddNull) {
  var array = intArrayFromString(string, dontAddNull);
  var i = 0;
  while (i < array.length) {
    var chr = array[i];
    HEAP8[(((buffer)+(i))>>0)]=chr;
    i = i + 1;
  }
}
Module['writeStringToMemory'] = writeStringToMemory;

function writeArrayToMemory(array, buffer) {
  for (var i = 0; i < array.length; i++) {
    HEAP8[((buffer++)>>0)]=array[i];
  }
}
Module['writeArrayToMemory'] = writeArrayToMemory;

function writeAsciiToMemory(str, buffer, dontAddNull) {
  for (var i = 0; i < str.length; ++i) {
    assert(str.charCodeAt(i) === str.charCodeAt(i)&0xff);
    HEAP8[((buffer++)>>0)]=str.charCodeAt(i);
  }
  // Null-terminate the pointer to the HEAP.
  if (!dontAddNull) HEAP8[((buffer)>>0)]=0;
}
Module['writeAsciiToMemory'] = writeAsciiToMemory;

function unSign(value, bits, ignore) {
  if (value >= 0) {
    return value;
  }
  return bits <= 32 ? 2*Math.abs(1 << (bits-1)) + value // Need some trickery, since if bits == 32, we are right at the limit of the bits JS uses in bitshifts
                    : Math.pow(2, bits)         + value;
}
function reSign(value, bits, ignore) {
  if (value <= 0) {
    return value;
  }
  var half = bits <= 32 ? Math.abs(1 << (bits-1)) // abs is needed if bits == 32
                        : Math.pow(2, bits-1);
  if (value >= half && (bits <= 32 || value > half)) { // for huge values, we can hit the precision limit and always get true here. so don't do that
                                                       // but, in general there is no perfect solution here. With 64-bit ints, we get rounding and errors
                                                       // TODO: In i64 mode 1, resign the two parts separately and safely
    value = -2*half + value; // Cannot bitshift half, as it may be at the limit of the bits JS uses in bitshifts
  }
  return value;
}

// check for imul support, and also for correctness ( https://bugs.webkit.org/show_bug.cgi?id=126345 )
if (!Math['imul'] || Math['imul'](0xffffffff, 5) !== -5) Math['imul'] = function imul(a, b) {
  var ah  = a >>> 16;
  var al = a & 0xffff;
  var bh  = b >>> 16;
  var bl = b & 0xffff;
  return (al*bl + ((ah*bl + al*bh) << 16))|0;
};
Math.imul = Math['imul'];


if (!Math['clz32']) Math['clz32'] = function(x) {
  x = x >>> 0;
  for (var i = 0; i < 32; i++) {
    if (x & (1 << (31 - i))) return i;
  }
  return 32;
};
Math.clz32 = Math['clz32']

var Math_abs = Math.abs;
var Math_cos = Math.cos;
var Math_sin = Math.sin;
var Math_tan = Math.tan;
var Math_acos = Math.acos;
var Math_asin = Math.asin;
var Math_atan = Math.atan;
var Math_atan2 = Math.atan2;
var Math_exp = Math.exp;
var Math_log = Math.log;
var Math_sqrt = Math.sqrt;
var Math_ceil = Math.ceil;
var Math_floor = Math.floor;
var Math_pow = Math.pow;
var Math_imul = Math.imul;
var Math_fround = Math.fround;
var Math_min = Math.min;
var Math_clz32 = Math.clz32;

// A counter of dependencies for calling run(). If we need to
// do asynchronous work before running, increment this and
// decrement it. Incrementing must happen in a place like
// PRE_RUN_ADDITIONS (used by emcc to add file preloading).
// Note that you can add dependencies in preRun, even though
// it happens right before run - run will be postponed until
// the dependencies are met.
var runDependencies = 0;
var runDependencyWatcher = null;
var dependenciesFulfilled = null; // overridden to take different actions when all run dependencies are fulfilled
var runDependencyTracking = {};

function addRunDependency(id) {
  runDependencies++;
  if (Module['monitorRunDependencies']) {
    Module['monitorRunDependencies'](runDependencies);
  }
  if (id) {
    assert(!runDependencyTracking[id]);
    runDependencyTracking[id] = 1;
    if (runDependencyWatcher === null && typeof setInterval !== 'undefined') {
      // Check for missing dependencies every few seconds
      runDependencyWatcher = setInterval(function() {
        if (ABORT) {
          clearInterval(runDependencyWatcher);
          runDependencyWatcher = null;
          return;
        }
        var shown = false;
        for (var dep in runDependencyTracking) {
          if (!shown) {
            shown = true;
            Module.printErr('still waiting on run dependencies:');
          }
          Module.printErr('dependency: ' + dep);
        }
        if (shown) {
          Module.printErr('(end of list)');
        }
      }, 10000);
    }
  } else {
    Module.printErr('warning: run dependency added without ID');
  }
}
Module['addRunDependency'] = addRunDependency;
function removeRunDependency(id) {
  runDependencies--;
  if (Module['monitorRunDependencies']) {
    Module['monitorRunDependencies'](runDependencies);
  }
  if (id) {
    assert(runDependencyTracking[id]);
    delete runDependencyTracking[id];
  } else {
    Module.printErr('warning: run dependency removed without ID');
  }
  if (runDependencies == 0) {
    if (runDependencyWatcher !== null) {
      clearInterval(runDependencyWatcher);
      runDependencyWatcher = null;
    }
    if (dependenciesFulfilled) {
      var callback = dependenciesFulfilled;
      dependenciesFulfilled = null;
      callback(); // can add another dependenciesFulfilled
    }
  }
}
Module['removeRunDependency'] = removeRunDependency;

Module["preloadedImages"] = {}; // maps url to image data
Module["preloadedAudios"] = {}; // maps url to audio data


var memoryInitializer = null;

// === Body ===





STATIC_BASE = 8;

STATICTOP = STATIC_BASE + 7184;
  /* global initializers */ __ATINIT__.push();
  

/* memory initializer */ allocate([0,0,0,0,80,0,0,0,1,0,0,0,2,0,0,0,78,54,115,113,117,105,115,104,49,48,67,108,117,115,116,101,114,70,105,116,69,0,0,0,78,54,115,113,117,105,115,104,57,67,111,108,111,117,114,70,105,116,69,0,0,0,0,0,152,25,0,0,48,0,0,0,192,25,0,0,24,0,0,0,72,0,0,0,0,0,0,0,0,0,0,0,72,0,0,0,3,0,0,0,3,0,0,0,0,0,0,0,152,0,0,0,4,0,0,0,5,0,0,0,78,54,115,113,117,105,115,104,56,82,97,110,103,101,70,105,116,69,0,0,0,0,0,0,192,25,0,0,128,0,0,0,72,0,0,0,0,0,0,0,0,0,0,0,248,24,0,0,6,0,0,0,7,0,0,0,200,0,0,0,200,6,0,0,200,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,1,0,0,2,0,0,2,0,0,3,0,1,1,0,0,4,0,1,0,1,0,3,0,1,1,1,0,2,0,1,2,1,0,1,0,2,1,1,0,0,0,2,0,1,0,1,0,2,1,1,0,2,0,2,2,1,0,3,0,3,1,1,0,4,0,3,0,2,0,3,0,3,1,2,0,2,0,3,2,2,0,1,0,4,1,2,0,0,0,4,0,2,0,1,0,4,1,2,0,2,0,4,2,2,0,3,0,5,1,2,0,4,0,5,0,3,0,3,0,5,1,3,0,2,0,5,2,3,0,1,0,6,1,3,0,0,0,6,0,3,0,1,0,6,1,3,0,2,0,6,2,3,0,3,0,7,1,3,0,4,0,7,0,4,0,4,0,7,1,4,0,3,0,7,2,4,0,2,1,7,1,4,0,1,1,7,0,4,0,0,0,8,0,4,0,1,0,8,1,4,0,2,2,7,1,4,0,3,2,7,0,4,0,4,0,9,0,5,0,3,0,9,1,5,0,2,3,7,1,5,0,1,3,7,0,5,0,0,0,10,0,5,0,1,0,10,1,5,0,2,0,10,2,5,0,3,0,11,1,5,0,4,0,11,0,6,0,3,0,11,1,6,0,2,0,11,2,6,0,1,0,12,1,6,0,0,0,12,0,6,0,1,0,12,1,6,0,2,0,12,2,6,0,3,0,13,1,6,0,4,0,13,0,7,0,3,0,13,1,7,0,2,0,13,2,7,0,1,0,14,1,7,0,0,0,14,0,7,0,1,0,14,1,7,0,2,0,14,2,7,0,3,0,15,1,7,0,4,0,15,0,8,0,4,0,15,1,8,0,3,0,15,2,8,0,2,1,15,1,8,0,1,1,15,0,8,0,0,0,16,0,8,0,1,0,16,1,8,0,2,2,15,1,8,0,3,2,15,0,8,0,4,0,17,0,9,0,3,0,17,1,9,0,2,3,15,1,9,0,1,3,15,0,9,0,0,0,18,0,9,0,1,0,18,1,9,0,2,0,18,2,9,0,3,0,19,1,9,0,4,0,19,0,10,0,3,0,19,1,10,0,2,0,19,2,10,0,1,0,20,1,10,0,0,0,20,0,10,0,1,0,20,1,10,0,2,0,20,2,10,0,3,0,21,1,10,0,4,0,21,0,11,0,3,0,21,1,11,0,2,0,21,2,11,0,1,0,22,1,11,0,0,0,22,0,11,0,1,0,22,1,11,0,2,0,22,2,11,0,3,0,23,1,11,0,4,0,23,0,12,0,4,0,23,1,12,0,3,0,23,2,12,0,2,1,23,1,12,0,1,1,23,0,12,0,0,0,24,0,12,0,1,0,24,1,12,0,2,2,23,1,12,0,3,2,23,0,12,0,4,0,25,0,13,0,3,0,25,1,13,0,2,3,23,1,13,0,1,3,23,0,13,0,0,0,26,0,13,0,1,0,26,1,13,0,2,0,26,2,13,0,3,0,27,1,13,0,4,0,27,0,14,0,3,0,27,1,14,0,2,0,27,2,14,0,1,0,28,1,14,0,0,0,28,0,14,0,1,0,28,1,14,0,2,0,28,2,14,0,3,0,29,1,14,0,4,0,29,0,15,0,3,0,29,1,15,0,2,0,29,2,15,0,1,0,30,1,15,0,0,0,30,0,15,0,1,0,30,1,15,0,2,0,30,2,15,0,3,0,31,1,15,0,4,0,31,0,16,0,4,0,31,1,16,0,3,0,31,2,16,0,2,1,31,1,16,0,1,1,31,0,16,0,0,4,28,0,16,0,1,4,28,1,16,0,2,2,31,1,16,0,3,2,31,0,16,0,4,4,29,0,17,0,3,4,29,1,17,0,2,3,31,1,17,0,1,3,31,0,17,0,0,4,30,0,17,0,1,4,30,1,17,0,2,4,30,2,17,0,3,4,31,1,17,0,4,4,31,0,18,0,3,4,31,1,18,0,2,4,31,2,18,0,1,5,31,1,18,0,0,5,31,0,18,0,1,5,31,1,18,0,2,5,31,2,18,0,3,6,31,1,18,0,4,6,31,0,19,0,3,6,31,1,19,0,2,6,31,2,19,0,1,7,31,1,19,0,0,7,31,0,19,0,1,7,31,1,19,0,2,7,31,2,19,0,3,8,31,1,19,0,4,8,31,0,20,0,4,8,31,1,20,0,3,8,31,2,20,0,2,9,31,1,20,0,1,9,31,0,20,0,0,12,28,0,20,0,1,12,28,1,20,0,2,10,31,1,20,0,3,10,31,0,20,0,4,12,29,0,21,0,3,12,29,1,21,0,2,11,31,1,21,0,1,11,31,0,21,0,0,12,30,0,21,0,1,12,30,1,21,0,2,12,30,2,21,0,3,12,31,1,21,0,4,12,31,0,22,0,3,12,31,1,22,0,2,12,31,2,22,0,1,13,31,1,22,0,0,13,31,0,22,0,1,13,31,1,22,0,2,13,31,2,22,0,3,14,31,1,22,0,4,14,31,0,23,0,3,14,31,1,23,0,2,14,31,2,23,0,1,15,31,1,23,0,0,15,31,0,23,0,1,15,31,1,23,0,2,15,31,2,23,0,3,16,31,1,23,0,4,16,31,0,24,0,4,16,31,1,24,0,3,16,31,2,24,0,2,17,31,1,24,0,1,17,31,0,24,0,0,20,28,0,24,0,1,20,28,1,24,0,2,18,31,1,24,0,3,18,31,0,24,0,4,20,29,0,25,0,3,20,29,1,25,0,2,19,31,1,25,0,1,19,31,0,25,0,0,20,30,0,25,0,1,20,30,1,25,0,2,20,30,2,25,0,3,20,31,1,25,0,4,20,31,0,26,0,3,20,31,1,26,0,2,20,31,2,26,0,1,21,31,1,26,0,0,21,31,0,26,0,1,21,31,1,26,0,2,21,31,2,26,0,3,22,31,1,26,0,4,22,31,0,27,0,3,22,31,1,27,0,2,22,31,2,27,0,1,23,31,1,27,0,0,23,31,0,27,0,1,23,31,1,27,0,2,23,31,2,27,0,3,24,31,1,27,0,4,24,31,0,28,0,4,24,31,1,28,0,3,24,31,2,28,0,2,25,31,1,28,0,1,25,31,0,28,0,0,28,28,0,28,0,1,28,28,1,28,0,2,26,31,1,28,0,3,26,31,0,28,0,4,28,29,0,29,0,3,28,29,1,29,0,2,27,31,1,29,0,1,27,31,0,29,0,0,28,30,0,29,0,1,28,30,1,29,0,2,28,30,2,29,0,3,28,31,1,29,0,4,28,31,0,30,0,3,28,31,1,30,0,2,28,31,2,30,0,1,29,31,1,30,0,0,29,31,0,30,0,1,29,31,1,30,0,2,29,31,2,30,0,3,30,31,1,30,0,4,30,31,0,31,0,3,30,31,1,31,0,2,30,31,2,31,0,1,31,31,1,31,0,0,31,31,0,0,0,0,0,0,0,0,0,1,0,1,1,0,0,2,0,1,0,1,0,1,0,2,1,1,0,0,0,2,0,1,0,1,0,3,1,1,0,2,0,3,0,2,0,1,0,4,1,2,0,0,0,4,0,2,0,1,0,5,1,2,0,2,0,5,0,3,0,1,0,6,1,3,0,0,0,6,0,3,0,1,0,7,1,3,0,2,0,7,0,4,0,1,0,8,1,4,0,0,0,8,0,4,0,1,0,9,1,4,0,2,0,9,0,5,0,1,0,10,1,5,0,0,0,10,0,5,0,1,0,11,1,5,0,2,0,11,0,6,0,1,0,12,1,6,0,0,0,12,0,6,0,1,0,13,1,6,0,2,0,13,0,7,0,1,0,14,1,7,0,0,0,14,0,7,0,1,0,15,1,7,0,2,0,15,0,8,0,1,0,16,1,8,0,0,0,16,0,8,0,1,0,17,1,8,0,2,0,17,0,9,0,1,0,18,1,9,0,0,0,18,0,9,0,1,0,19,1,9,0,2,0,19,0,10,0,1,0,20,1,10,0,0,0,20,0,10,0,1,0,21,1,10,0,2,0,21,0,11,0,1,0,22,1,11,0,0,0,22,0,11,0,1,0,23,1,11,0,2,0,23,0,12,0,1,0,24,1,12,0,0,0,24,0,12,0,1,0,25,1,12,0,2,0,25,0,13,0,1,0,26,1,13,0,0,0,26,0,13,0,1,0,27,1,13,0,2,0,27,0,14,0,1,0,28,1,14,0,0,0,28,0,14,0,1,0,29,1,14,0,2,0,29,0,15,0,1,0,30,1,15,0,0,0,30,0,15,0,1,0,31,1,15,0,2,0,31,0,16,0,2,1,31,1,16,0,1,1,31,0,16,0,0,0,32,0,16,0,1,2,31,0,16,0,2,0,33,0,17,0,1,3,31,0,17,0,0,0,34,0,17,0,1,4,31,0,17,0,2,0,35,0,18,0,1,5,31,0,18,0,0,0,36,0,18,0,1,6,31,0,18,0,2,0,37,0,19,0,1,7,31,0,19,0,0,0,38,0,19,0,1,8,31,0,19,0,2,0,39,0,20,0,1,9,31,0,20,0,0,0,40,0,20,0,1,10,31,0,20,0,2,0,41,0,21,0,1,11,31,0,21,0,0,0,42,0,21,0,1,12,31,0,21,0,2,0,43,0,22,0,1,13,31,0,22,0,0,0,44,0,22,0,1,14,31,0,22,0,2,0,45,0,23,0,1,15,31,0,23,0,0,0,46,0,23,0,1,0,47,1,23,0,2,0,47,0,24,0,1,0,48,1,24,0,0,0,48,0,24,0,1,0,49,1,24,0,2,0,49,0,25,0,1,0,50,1,25,0,0,0,50,0,25,0,1,0,51,1,25,0,2,0,51,0,26,0,1,0,52,1,26,0,0,0,52,0,26,0,1,0,53,1,26,0,2,0,53,0,27,0,1,0,54,1,27,0,0,0,54,0,27,0,1,0,55,1,27,0,2,0,55,0,28,0,1,0,56,1,28,0,0,0,56,0,28,0,1,0,57,1,28,0,2,0,57,0,29,0,1,0,58,1,29,0,0,0,58,0,29,0,1,0,59,1,29,0,2,0,59,0,30,0,1,0,60,1,30,0,0,0,60,0,30,0,1,0,61,1,30,0,2,0,61,0,31,0,1,0,62,1,31,0,0,0,62,0,31,0,1,0,63,1,31,0,2,0,63,0,32,0,2,1,63,1,32,0,1,1,63,0,32,0,0,16,48,0,32,0,1,2,63,0,32,0,2,16,49,0,33,0,1,3,63,0,33,0,0,16,50,0,33,0,1,4,63,0,33,0,2,16,51,0,34,0,1,5,63,0,34,0,0,16,52,0,34,0,1,6,63,0,34,0,2,16,53,0,35,0,1,7,63,0,35,0,0,16,54,0,35,0,1,8,63,0,35,0,2,16,55,0,36,0,1,9,63,0,36,0,0,16,56,0,36,0,1,10,63,0,36,0,2,16,57,0,37,0,1,11,63,0,37,0,0,16,58,0,37,0,1,12,63,0,37,0,2,16,59,0,38,0,1,13,63,0,38,0,0,16,60,0,38,0,1,14,63,0,38,0,2,16,61,0,39,0,1,15,63,0,39,0,0,16,62,0,39,0,1,16,63,1,39,0,2,16,63,0,40,0,1,17,63,1,40,0,0,17,63,0,40,0,1,18,63,1,40,0,2,18,63,0,41,0,1,19,63,1,41,0,0,19,63,0,41,0,1,20,63,1,41,0,2,20,63,0,42,0,1,21,63,1,42,0,0,21,63,0,42,0,1,22,63,1,42,0,2,22,63,0,43,0,1,23,63,1,43,0,0,23,63,0,43,0,1,24,63,1,43,0,2,24,63,0,44,0,1,25,63,1,44,0,0,25,63,0,44,0,1,26,63,1,44,0,2,26,63,0,45,0,1,27,63,1,45,0,0,27,63,0,45,0,1,28,63,1,45,0,2,28,63,0,46,0,1,29,63,1,46,0,0,29,63,0,46,0,1,30,63,1,46,0,2,30,63,0,47,0,1,31,63,1,47,0,0,31,63,0,47,0,1,32,63,1,47,0,2,32,63,0,48,0,2,33,63,1,48,0,1,33,63,0,48,0,0,48,48,0,48,0,1,34,63,0,48,0,2,48,49,0,49,0,1,35,63,0,49,0,0,48,50,0,49,0,1,36,63,0,49,0,2,48,51,0,50,0,1,37,63,0,50,0,0,48,52,0,50,0,1,38,63,0,50,0,2,48,53,0,51,0,1,39,63,0,51,0,0,48,54,0,51,0,1,40,63,0,51,0,2,48,55,0,52,0,1,41,63,0,52,0,0,48,56,0,52,0,1,42,63,0,52,0,2,48,57,0,53,0,1,43,63,0,53,0,0,48,58,0,53,0,1,44,63,0,53,0,2,48,59,0,54,0,1,45,63,0,54,0,0,48,60,0,54,0,1,46,63,0,54,0,2,48,61,0,55,0,1,47,63,0,55,0,0,48,62,0,55,0,1,48,63,1,55,0,2,48,63,0,56,0,1,49,63,1,56,0,0,49,63,0,56,0,1,50,63,1,56,0,2,50,63,0,57,0,1,51,63,1,57,0,0,51,63,0,57,0,1,52,63,1,57,0,2,52,63,0,58,0,1,53,63,1,58,0,0,53,63,0,58,0,1,54,63,1,58,0,2,54,63,0,59,0,1,55,63,1,59,0,0,55,63,0,59,0,1,56,63,1,59,0,2,56,63,0,60,0,1,57,63,1,60,0,0,57,63,0,60,0,1,58,63,1,60,0,2,58,63,0,61,0,1,59,63,1,61,0,0,59,63,0,61,0,1,60,63,1,61,0,2,60,63,0,62,0,1,61,63,1,62,0,0,61,63,0,62,0,1,62,63,1,62,0,2,62,63,0,63,0,1,63,63,1,63,0,0,63,63,0,216,12,0,0,216,18,0,0,216,12,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,0,0,2,0,1,0,0,0,3,0,1,1,0,0,4,0,2,1,1,0,3,0,2,0,1,0,2,0,2,1,1,0,1,0,3,1,1,0,0,0,3,0,1,0,1,1,2,1,1,0,2,1,2,0,1,0,3,0,4,0,1,0,4,0,5,1,2,0,3,0,5,0,2,0,2,0,5,1,2,0,1,0,6,1,2,0,0,0,6,0,2,0,1,2,3,1,2,0,2,2,3,0,2,0,3,0,7,0,2,0,4,1,6,1,3,0,3,1,6,0,3,0,2,0,8,0,3,0,1,0,9,1,3,0,0,0,9,0,3,0,1,0,9,1,3,0,2,0,10,1,3,0,3,0,10,0,3,0,4,2,7,1,4,0,4,2,7,0,4,0,3,0,11,0,4,0,2,1,10,1,4,0,1,1,10,0,4,0,0,0,12,0,4,0,1,0,13,1,4,0,2,0,13,0,4,0,3,0,13,1,4,0,4,0,14,1,5,0,3,0,14,0,5,0,2,2,11,1,5,0,1,2,11,0,5,0,0,0,15,0,5,0,1,1,14,1,5,0,2,1,14,0,5,0,3,0,16,0,5,0,4,0,17,1,6,0,3,0,17,0,6,0,2,0,17,1,6,0,1,0,18,1,6,0,0,0,18,0,6,0,1,2,15,1,6,0,2,2,15,0,6,0,3,0,19,0,6,0,4,1,18,1,7,0,3,1,18,0,7,0,2,0,20,0,7,0,1,0,21,1,7,0,0,0,21,0,7,0,1,0,21,1,7,0,2,0,22,1,7,0,3,0,22,0,7,0,4,2,19,1,8,0,4,2,19,0,8,0,3,0,23,0,8,0,2,1,22,1,8,0,1,1,22,0,8,0,0,0,24,0,8,0,1,0,25,1,8,0,2,0,25,0,8,0,3,0,25,1,8,0,4,0,26,1,9,0,3,0,26,0,9,0,2,2,23,1,9,0,1,2,23,0,9,0,0,0,27,0,9,0,1,1,26,1,9,0,2,1,26,0,9,0,3,0,28,0,9,0,4,0,29,1,10,0,3,0,29,0,10,0,2,0,29,1,10,0,1,0,30,1,10,0,0,0,30,0,10,0,1,2,27,1,10,0,2,2,27,0,10,0,3,0,31,0,10,0,4,1,30,1,11,0,3,1,30,0,11,0,2,4,24,0,11,0,1,1,31,1,11,0,0,1,31,0,11,0,1,1,31,1,11,0,2,2,30,1,11,0,3,2,30,0,11,0,4,2,31,1,12,0,4,2,31,0,12,0,3,4,27,0,12,0,2,3,30,1,12,0,1,3,30,0,12,0,0,4,28,0,12,0,1,3,31,1,12,0,2,3,31,0,12,0,3,3,31,1,12,0,4,4,30,1,13,0,3,4,30,0,13,0,2,6,27,1,13,0,1,6,27,0,13,0,0,4,31,0,13,0,1,5,30,1,13,0,2,5,30,0,13,0,3,8,24,0,13,0,4,5,31,1,14,0,3,5,31,0,14,0,2,5,31,1,14,0,1,6,30,1,14,0,0,6,30,0,14,0,1,6,31,1,14,0,2,6,31,0,14,0,3,8,27,0,14,0,4,7,30,1,15,0,3,7,30,0,15,0,2,8,28,0,15,0,1,7,31,1,15,0,0,7,31,0,15,0,1,7,31,1,15,0,2,8,30,1,15,0,3,8,30,0,15,0,4,10,27,1,16,0,4,10,27,0,16,0,3,8,31,0,16,0,2,9,30,1,16,0,1,9,30,0,16,0,0,12,24,0,16,0,1,9,31,1,16,0,2,9,31,0,16,0,3,9,31,1,16,0,4,10,30,1,17,0,3,10,30,0,17,0,2,10,31,1,17,0,1,10,31,0,17,0,0,12,27,0,17,0,1,11,30,1,17,0,2,11,30,0,17,0,3,12,28,0,17,0,4,11,31,1,18,0,3,11,31,0,18,0,2,11,31,1,18,0,1,12,30,1,18,0,0,12,30,0,18,0,1,14,27,1,18,0,2,14,27,0,18,0,3,12,31,0,18,0,4,13,30,1,19,0,3,13,30,0,19,0,2,16,24,0,19,0,1,13,31,1,19,0,0,13,31,0,19,0,1,13,31,1,19,0,2,14,30,1,19,0,3,14,30,0,19,0,4,14,31,1,20,0,4,14,31,0,20,0,3,16,27,0,20,0,2,15,30,1,20,0,1,15,30,0,20,0,0,16,28,0,20,0,1,15,31,1,20,0,2,15,31,0,20,0,3,15,31,1,20,0,4,16,30,1,21,0,3,16,30,0,21,0,2,18,27,1,21,0,1,18,27,0,21,0,0,16,31,0,21,0,1,17,30,1,21,0,2,17,30,0,21,0,3,20,24,0,21,0,4,17,31,1,22,0,3,17,31,0,22,0,2,17,31,1,22,0,1,18,30,1,22,0,0,18,30,0,22,0,1,18,31,1,22,0,2,18,31,0,22,0,3,20,27,0,22,0,4,19,30,1,23,0,3,19,30,0,23,0,2,20,28,0,23,0,1,19,31,1,23,0,0,19,31,0,23,0,1,19,31,1,23,0,2,20,30,1,23,0,3,20,30,0,23,0,4,22,27,1,24,0,4,22,27,0,24,0,3,20,31,0,24,0,2,21,30,1,24,0,1,21,30,0,24,0,0,24,24,0,24,0,1,21,31,1,24,0,2,21,31,0,24,0,3,21,31,1,24,0,4,22,30,1,25,0,3,22,30,0,25,0,2,22,31,1,25,0,1,22,31,0,25,0,0,24,27,0,25,0,1,23,30,1,25,0,2,23,30,0,25,0,3,24,28,0,25,0,4,23,31,1,26,0,3,23,31,0,26,0,2,23,31,1,26,0,1,24,30,1,26,0,0,24,30,0,26,0,1,26,27,1,26,0,2,26,27,0,26,0,3,24,31,0,26,0,4,25,30,1,27,0,3,25,30,0,27,0,2,28,24,0,27,0,1,25,31,1,27,0,0,25,31,0,27,0,1,25,31,1,27,0,2,26,30,1,27,0,3,26,30,0,27,0,4,26,31,1,28,0,4,26,31,0,28,0,3,28,27,0,28,0,2,27,30,1,28,0,1,27,30,0,28,0,0,28,28,0,28,0,1,27,31,1,28,0,2,27,31,0,28,0,3,27,31,1,28,0,4,28,30,1,29,0,3,28,30,0,29,0,2,30,27,1,29,0,1,30,27,0,29,0,0,28,31,0,29,0,1,29,30,1,29,0,2,29,30,0,29,0,3,29,30,1,29,0,4,29,31,1,30,0,3,29,31,0,30,0,2,29,31,1,30,0,1,30,30,1,30,0,0,30,30,0,30,0,1,30,31,1,30,0,2,30,31,0,30,0,3,30,31,1,30,0,4,31,30,1,31,0,3,31,30,0,31,0,2,31,30,1,31,0,1,31,31,1,31,0,0,31,31,0,0,0,0,0,0,0,0,0,1,0,1,0,0,0,2,0,2,0,1,0,1,0,3,1,1,0,0,0,3,0,1,0,1,0,4,0,1,0,2,0,5,0,2,0,1,0,6,1,2,0,0,0,6,0,2,0,1,0,7,0,2,0,2,0,8,0,3,0,1,0,9,1,3,0,0,0,9,0,3,0,1,0,10,0,3,0,2,0,11,0,4,0,1,0,12,1,4,0,0,0,12,0,4,0,1,0,13,0,4,0,2,0,14,0,5,0,1,0,15,1,5,0,0,0,15,0,5,0,1,0,16,0,5,0,2,1,15,0,6,0,1,0,17,0,6,0,0,0,18,0,6,0,1,0,19,0,6,0,2,3,14,0,7,0,1,0,20,0,7,0,0,0,21,0,7,0,1,0,22,0,7,0,2,4,15,0,8,0,1,0,23,0,8,0,0,0,24,0,8,0,1,0,25,0,8,0,2,6,14,0,9,0,1,0,26,0,9,0,0,0,27,0,9,0,1,0,28,0,9,0,2,7,15,0,10,0,1,0,29,0,10,0,0,0,30,0,10,0,1,0,31,0,10,0,2,9,14,0,11,0,1,0,32,0,11,0,0,0,33,0,11,0,1,2,30,0,11,0,2,0,34,0,12,0,1,0,35,0,12,0,0,0,36,0,12,0,1,3,31,0,12,0,2,0,37,0,13,0,1,0,38,0,13,0,0,0,39,0,13,0,1,5,30,0,13,0,2,0,40,0,14,0,1,0,41,0,14,0,0,0,42,0,14,0,1,6,31,0,14,0,2,0,43,0,15,0,1,0,44,0,15,0,0,0,45,0,15,0,1,8,30,0,15,0,2,0,46,0,16,0,2,0,47,0,16,0,1,1,46,0,16,0,0,0,48,0,16,0,1,0,49,0,16,0,2,0,50,0,17,0,1,2,47,0,17,0,0,0,51,0,17,0,1,0,52,0,17,0,2,0,53,0,18,0,1,4,46,0,18,0,0,0,54,0,18,0,1,0,55,0,18,0,2,0,56,0,19,0,1,5,47,0,19,0,0,0,57,0,19,0,1,0,58,0,19,0,2,0,59,0,20,0,1,7,46,0,20,0,0,0,60,0,20,0,1,0,61,0,20,0,2,0,62,0,21,0,1,8,47,0,21,0,0,0,63,0,21,0,1,1,62,0,21,0,2,1,63,0,22,0,1,10,46,0,22,0,0,2,62,0,22,0,1,2,63,0,22,0,2,3,62,0,23,0,1,11,47,0,23,0,0,3,63,0,23,0,1,4,62,0,23,0,2,4,63,0,24,0,1,13,46,0,24,0,0,5,62,0,24,0,1,5,63,0,24,0,2,6,62,0,25,0,1,14,47,0,25,0,0,6,63,0,25,0,1,7,62,0,25,0,2,7,63,0,26,0,1,16,45,0,26,0,0,8,62,0,26,0,1,8,63,0,26,0,2,9,62,0,27,0,1,16,48,0,27,0,0,9,63,0,27,0,1,10,62,0,27,0,2,10,63,0,28,0,1,16,51,0,28,0,0,11,62,0,28,0,1,11,63,0,28,0,2,12,62,0,29,0,1,16,54,0,29,0,0,12,63,0,29,0,1,13,62,0,29,0,2,13,63,0,30,0,1,16,57,0,30,0,0,14,62,0,30,0,1,14,63,0,30,0,2,15,62,0,31,0,1,16,60,0,31,0,0,15,63,0,31,0,1,24,46,0,31,0,2,16,62,0,32,0,2,16,63,0,32,0,1,17,62,0,32,0,0,25,47,0,32,0,1,17,63,0,32,0,2,18,62,0,33,0,1,18,63,0,33,0,0,27,46,0,33,0,1,19,62,0,33,0,2,19,63,0,34,0,1,20,62,0,34,0,0,28,47,0,34,0,1,20,63,0,34,0,2,21,62,0,35,0,1,21,63,0,35,0,0,30,46,0,35,0,1,22,62,0,35,0,2,22,63,0,36,0,1,23,62,0,36,0,0,31,47,0,36,0,1,23,63,0,36,0,2,24,62,0,37,0,1,24,63,0,37,0,0,32,47,0,37,0,1,25,62,0,37,0,2,25,63,0,38,0,1,26,62,0,38,0,0,32,50,0,38,0,1,26,63,0,38,0,2,27,62,0,39,0,1,27,63,0,39,0,0,32,53,0,39,0,1,28,62,0,39,0,2,28,63,0,40,0,1,29,62,0,40,0,0,32,56,0,40,0,1,29,63,0,40,0,2,30,62,0,41,0,1,30,63,0,41,0,0,32,59,0,41,0,1,31,62,0,41,0,2,31,63,0,42,0,1,32,61,0,42,0,0,32,62,0,42,0,1,32,63,0,42,0,2,41,46,0,43,0,1,33,62,0,43,0,0,33,63,0,43,0,1,34,62,0,43,0,2,42,47,0,44,0,1,34,63,0,44,0,0,35,62,0,44,0,1,35,63,0,44,0,2,44,46,0,45,0,1,36,62,0,45,0,0,36,63,0,45,0,1,37,62,0,45,0,2,45,47,0,46,0,1,37,63,0,46,0,0,38,62,0,46,0,1,38,63,0,46,0,2,47,46,0,47,0,1,39,62,0,47,0,0,39,63,0,47,0,1,40,62,0,47,0,2,48,46,0,48,0,2,40,63,0,48,0,1,41,62,0,48,0,0,41,63,0,48,0,1,48,49,0,48,0,2,42,62,0,49,0,1,42,63,0,49,0,0,43,62,0,49,0,1,48,52,0,49,0,2,43,63,0,50,0,1,44,62,0,50,0,0,44,63,0,50,0,1,48,55,0,50,0,2,45,62,0,51,0,1,45,63,0,51,0,0,46,62,0,51,0,1,48,58,0,51,0,2,46,63,0,52,0,1,47,62,0,52,0,0,47,63,0,52,0,1,48,61,0,52,0,2,48,62,0,53,0,1,56,47,0,53,0,0,48,63,0,53,0,1,49,62,0,53,0,2,49,63,0,54,0,1,58,46,0,54,0,0,50,62,0,54,0,1,50,63,0,54,0,2,51,62,0,55,0,1,59,47,0,55,0,0,51,63,0,55,0,1,52,62,0,55,0,2,52,63,0,56,0,1,61,46,0,56,0,0,53,62,0,56,0,1,53,63,0,56,0,2,54,62,0,57,0,1,62,47,0,57,0,0,54,63,0,57,0,1,55,62,0,57,0,2,55,63,0,58,0,1,56,62,1,58,0,0,56,62,0,58,0,1,56,63,0,58,0,2,57,62,0,59,0,1,57,63,1,59,0,0,57,63,0,59,0,1,58,62,0,59,0,2,58,63,0,60,0,1,59,62,1,60,0,0,59,62,0,60,0,1,59,63,0,60,0,2,60,62,0,61,0,1,60,63,1,61,0,0,60,63,0,61,0,1,61,62,0,61,0,2,61,63,0,62,0,1,62,62,1,62,0,0,62,62,0,62,0,1,62,63,0,62,0,2,63,62,0,63,0,1,63,63,1,63,0,0,63,63,0,78,54,115,113,117,105,115,104,49,53,83,105,110,103,108,101,67,111,108,111,117,114,70,105,116,69,0,0,0,0,0,0,192,25,0,0,216,24,0,0,72,0,0,0,0,0,0,0,83,116,57,116,121,112,101,95,105,110,102,111,0,0,0,0,152,25,0,0,8,25,0,0,78,49,48,95,95,99,120,120,97,98,105,118,49,49,54,95,95,115,104,105,109,95,116,121,112,101,95,105,110,102,111,69,0,0,0,0,0,0,0,0,192,25,0,0,32,25,0,0,24,25,0,0,0,0,0,0,78,49,48,95,95,99,120,120,97,98,105,118,49,49,55,95,95,99,108,97,115,115,95,116,121,112,101,95,105,110,102,111,69,0,0,0,0,0,0,0,192,25,0,0,88,25,0,0,72,25,0,0,0,0,0,0,0,0,0,0,128,25,0,0,8,0,0,0,9,0,0,0,10,0,0,0,11,0,0,0,12,0,0,0,13,0,0,0,14,0,0,0,15,0,0,0,0,0,0,0,8,26,0,0,8,0,0,0,16,0,0,0,10,0,0,0,11,0,0,0,12,0,0,0,17,0,0,0,18,0,0,0,19,0,0,0,78,49,48,95,95,99,120,120,97,98,105,118,49,50,48,95,95,115,105,95,99,108,97,115,115,95,116,121,112,101,95,105,110,102,111,69,0,0,0,0,192,25,0,0,224,25,0,0,128,25,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0], "i8", ALLOC_NONE, Runtime.GLOBAL_BASE);




var tempDoublePtr = Runtime.alignMemory(allocate(12, "i8", ALLOC_STATIC), 8);

assert(tempDoublePtr % 8 == 0);

function copyTempFloat(ptr) { // functions, because inlining this code increases code size too much

  HEAP8[tempDoublePtr] = HEAP8[ptr];

  HEAP8[tempDoublePtr+1] = HEAP8[ptr+1];

  HEAP8[tempDoublePtr+2] = HEAP8[ptr+2];

  HEAP8[tempDoublePtr+3] = HEAP8[ptr+3];

}

function copyTempDouble(ptr) {

  HEAP8[tempDoublePtr] = HEAP8[ptr];

  HEAP8[tempDoublePtr+1] = HEAP8[ptr+1];

  HEAP8[tempDoublePtr+2] = HEAP8[ptr+2];

  HEAP8[tempDoublePtr+3] = HEAP8[ptr+3];

  HEAP8[tempDoublePtr+4] = HEAP8[ptr+4];

  HEAP8[tempDoublePtr+5] = HEAP8[ptr+5];

  HEAP8[tempDoublePtr+6] = HEAP8[ptr+6];

  HEAP8[tempDoublePtr+7] = HEAP8[ptr+7];

}


  var _cosf=Math_cos;

  function ___cxa_pure_virtual() {
      ABORT = true;
      throw 'Pure virtual function called!';
    }

  var _fabsf=Math_abs;

  var _floorf=Math_floor;

   
  Module["_memset"] = _memset;

  var _ceilf=Math_ceil;

  function _abort() {
      Module['abort']();
    }

  var _sinf=Math_sin;

   
  Module["_strlen"] = _strlen;

  var _sqrtf=Math_sqrt;

  
  
  var ___errno_state=0;function ___setErrNo(value) {
      // For convenient setting and returning of errno.
      HEAP32[((___errno_state)>>2)]=value;
      return value;
    }
  
  var ERRNO_CODES={EPERM:1,ENOENT:2,ESRCH:3,EINTR:4,EIO:5,ENXIO:6,E2BIG:7,ENOEXEC:8,EBADF:9,ECHILD:10,EAGAIN:11,EWOULDBLOCK:11,ENOMEM:12,EACCES:13,EFAULT:14,ENOTBLK:15,EBUSY:16,EEXIST:17,EXDEV:18,ENODEV:19,ENOTDIR:20,EISDIR:21,EINVAL:22,ENFILE:23,EMFILE:24,ENOTTY:25,ETXTBSY:26,EFBIG:27,ENOSPC:28,ESPIPE:29,EROFS:30,EMLINK:31,EPIPE:32,EDOM:33,ERANGE:34,ENOMSG:42,EIDRM:43,ECHRNG:44,EL2NSYNC:45,EL3HLT:46,EL3RST:47,ELNRNG:48,EUNATCH:49,ENOCSI:50,EL2HLT:51,EDEADLK:35,ENOLCK:37,EBADE:52,EBADR:53,EXFULL:54,ENOANO:55,EBADRQC:56,EBADSLT:57,EDEADLOCK:35,EBFONT:59,ENOSTR:60,ENODATA:61,ETIME:62,ENOSR:63,ENONET:64,ENOPKG:65,EREMOTE:66,ENOLINK:67,EADV:68,ESRMNT:69,ECOMM:70,EPROTO:71,EMULTIHOP:72,EDOTDOT:73,EBADMSG:74,ENOTUNIQ:76,EBADFD:77,EREMCHG:78,ELIBACC:79,ELIBBAD:80,ELIBSCN:81,ELIBMAX:82,ELIBEXEC:83,ENOSYS:38,ENOTEMPTY:39,ENAMETOOLONG:36,ELOOP:40,EOPNOTSUPP:95,EPFNOSUPPORT:96,ECONNRESET:104,ENOBUFS:105,EAFNOSUPPORT:97,EPROTOTYPE:91,ENOTSOCK:88,ENOPROTOOPT:92,ESHUTDOWN:108,ECONNREFUSED:111,EADDRINUSE:98,ECONNABORTED:103,ENETUNREACH:101,ENETDOWN:100,ETIMEDOUT:110,EHOSTDOWN:112,EHOSTUNREACH:113,EINPROGRESS:115,EALREADY:114,EDESTADDRREQ:89,EMSGSIZE:90,EPROTONOSUPPORT:93,ESOCKTNOSUPPORT:94,EADDRNOTAVAIL:99,ENETRESET:102,EISCONN:106,ENOTCONN:107,ETOOMANYREFS:109,EUSERS:87,EDQUOT:122,ESTALE:116,ENOTSUP:95,ENOMEDIUM:123,EILSEQ:84,EOVERFLOW:75,ECANCELED:125,ENOTRECOVERABLE:131,EOWNERDEAD:130,ESTRPIPE:86};function _sysconf(name) {
      // long sysconf(int name);
      // http://pubs.opengroup.org/onlinepubs/009695399/functions/sysconf.html
      switch(name) {
        case 30: return PAGE_SIZE;
        case 132:
        case 133:
        case 12:
        case 137:
        case 138:
        case 15:
        case 235:
        case 16:
        case 17:
        case 18:
        case 19:
        case 20:
        case 149:
        case 13:
        case 10:
        case 236:
        case 153:
        case 9:
        case 21:
        case 22:
        case 159:
        case 154:
        case 14:
        case 77:
        case 78:
        case 139:
        case 80:
        case 81:
        case 79:
        case 82:
        case 68:
        case 67:
        case 164:
        case 11:
        case 29:
        case 47:
        case 48:
        case 95:
        case 52:
        case 51:
        case 46:
          return 200809;
        case 27:
        case 246:
        case 127:
        case 128:
        case 23:
        case 24:
        case 160:
        case 161:
        case 181:
        case 182:
        case 242:
        case 183:
        case 184:
        case 243:
        case 244:
        case 245:
        case 165:
        case 178:
        case 179:
        case 49:
        case 50:
        case 168:
        case 169:
        case 175:
        case 170:
        case 171:
        case 172:
        case 97:
        case 76:
        case 32:
        case 173:
        case 35:
          return -1;
        case 176:
        case 177:
        case 7:
        case 155:
        case 8:
        case 157:
        case 125:
        case 126:
        case 92:
        case 93:
        case 129:
        case 130:
        case 131:
        case 94:
        case 91:
          return 1;
        case 74:
        case 60:
        case 69:
        case 70:
        case 4:
          return 1024;
        case 31:
        case 42:
        case 72:
          return 32;
        case 87:
        case 26:
        case 33:
          return 2147483647;
        case 34:
        case 1:
          return 47839;
        case 38:
        case 36:
          return 99;
        case 43:
        case 37:
          return 2048;
        case 0: return 2097152;
        case 3: return 65536;
        case 28: return 32768;
        case 44: return 32767;
        case 75: return 16384;
        case 39: return 1000;
        case 89: return 700;
        case 71: return 256;
        case 40: return 255;
        case 2: return 100;
        case 180: return 64;
        case 25: return 20;
        case 5: return 16;
        case 6: return 6;
        case 73: return 4;
        case 84: {
          if (typeof navigator === 'object') return navigator['hardwareConcurrency'] || 1;
          return 1;
        }
      }
      ___setErrNo(ERRNO_CODES.EINVAL);
      return -1;
    }

  function _sbrk(bytes) {
      // Implement a Linux-like 'memory area' for our 'process'.
      // Changes the size of the memory area by |bytes|; returns the
      // address of the previous top ('break') of the memory area
      // We control the "dynamic" memory - DYNAMIC_BASE to DYNAMICTOP
      var self = _sbrk;
      if (!self.called) {
        DYNAMICTOP = alignMemoryPage(DYNAMICTOP); // make sure we start out aligned
        self.called = true;
        assert(Runtime.dynamicAlloc);
        self.alloc = Runtime.dynamicAlloc;
        Runtime.dynamicAlloc = function() { abort('cannot dynamically allocate, sbrk now has control') };
      }
      var ret = DYNAMICTOP;
      if (bytes != 0) self.alloc(bytes);
      return ret;  // Previous break location.
    }

  function ___errno_location() {
      return ___errno_state;
    }

  var _sqrt=Math_sqrt;

  
  function _emscripten_memcpy_big(dest, src, num) {
      HEAPU8.set(HEAPU8.subarray(src, src+num), dest);
      return dest;
    } 
  Module["_memcpy"] = _memcpy;

  var _llvm_pow_f32=Math_pow;

  
  
  
  var ERRNO_MESSAGES={0:"Success",1:"Not super-user",2:"No such file or directory",3:"No such process",4:"Interrupted system call",5:"I/O error",6:"No such device or address",7:"Arg list too long",8:"Exec format error",9:"Bad file number",10:"No children",11:"No more processes",12:"Not enough core",13:"Permission denied",14:"Bad address",15:"Block device required",16:"Mount device busy",17:"File exists",18:"Cross-device link",19:"No such device",20:"Not a directory",21:"Is a directory",22:"Invalid argument",23:"Too many open files in system",24:"Too many open files",25:"Not a typewriter",26:"Text file busy",27:"File too large",28:"No space left on device",29:"Illegal seek",30:"Read only file system",31:"Too many links",32:"Broken pipe",33:"Math arg out of domain of func",34:"Math result not representable",35:"File locking deadlock error",36:"File or path name too long",37:"No record locks available",38:"Function not implemented",39:"Directory not empty",40:"Too many symbolic links",42:"No message of desired type",43:"Identifier removed",44:"Channel number out of range",45:"Level 2 not synchronized",46:"Level 3 halted",47:"Level 3 reset",48:"Link number out of range",49:"Protocol driver not attached",50:"No CSI structure available",51:"Level 2 halted",52:"Invalid exchange",53:"Invalid request descriptor",54:"Exchange full",55:"No anode",56:"Invalid request code",57:"Invalid slot",59:"Bad font file fmt",60:"Device not a stream",61:"No data (for no delay io)",62:"Timer expired",63:"Out of streams resources",64:"Machine is not on the network",65:"Package not installed",66:"The object is remote",67:"The link has been severed",68:"Advertise error",69:"Srmount error",70:"Communication error on send",71:"Protocol error",72:"Multihop attempted",73:"Cross mount point (not really error)",74:"Trying to read unreadable message",75:"Value too large for defined data type",76:"Given log. name not unique",77:"f.d. invalid for this operation",78:"Remote address changed",79:"Can   access a needed shared lib",80:"Accessing a corrupted shared lib",81:".lib section in a.out corrupted",82:"Attempting to link in too many libs",83:"Attempting to exec a shared library",84:"Illegal byte sequence",86:"Streams pipe error",87:"Too many users",88:"Socket operation on non-socket",89:"Destination address required",90:"Message too long",91:"Protocol wrong type for socket",92:"Protocol not available",93:"Unknown protocol",94:"Socket type not supported",95:"Not supported",96:"Protocol family not supported",97:"Address family not supported by protocol family",98:"Address already in use",99:"Address not available",100:"Network interface is not configured",101:"Network is unreachable",102:"Connection reset by network",103:"Connection aborted",104:"Connection reset by peer",105:"No buffer space available",106:"Socket is already connected",107:"Socket is not connected",108:"Can't send after socket shutdown",109:"Too many references",110:"Connection timed out",111:"Connection refused",112:"Host is down",113:"Host is unreachable",114:"Socket already connected",115:"Connection already in progress",116:"Stale file handle",122:"Quota exceeded",123:"No medium (in tape drive)",125:"Operation canceled",130:"Previous owner died",131:"State not recoverable"};
  
  var TTY={ttys:[],init:function () {
        // https://github.com/kripken/emscripten/pull/1555
        // if (ENVIRONMENT_IS_NODE) {
        //   // currently, FS.init does not distinguish if process.stdin is a file or TTY
        //   // device, it always assumes it's a TTY device. because of this, we're forcing
        //   // process.stdin to UTF8 encoding to at least make stdin reading compatible
        //   // with text files until FS.init can be refactored.
        //   process['stdin']['setEncoding']('utf8');
        // }
      },shutdown:function () {
        // https://github.com/kripken/emscripten/pull/1555
        // if (ENVIRONMENT_IS_NODE) {
        //   // inolen: any idea as to why node -e 'process.stdin.read()' wouldn't exit immediately (with process.stdin being a tty)?
        //   // isaacs: because now it's reading from the stream, you've expressed interest in it, so that read() kicks off a _read() which creates a ReadReq operation
        //   // inolen: I thought read() in that case was a synchronous operation that just grabbed some amount of buffered data if it exists?
        //   // isaacs: it is. but it also triggers a _read() call, which calls readStart() on the handle
        //   // isaacs: do process.stdin.pause() and i'd think it'd probably close the pending call
        //   process['stdin']['pause']();
        // }
      },register:function (dev, ops) {
        TTY.ttys[dev] = { input: [], output: [], ops: ops };
        FS.registerDevice(dev, TTY.stream_ops);
      },stream_ops:{open:function (stream) {
          var tty = TTY.ttys[stream.node.rdev];
          if (!tty) {
            throw new FS.ErrnoError(ERRNO_CODES.ENODEV);
          }
          stream.tty = tty;
          stream.seekable = false;
        },close:function (stream) {
          // flush any pending line data
          stream.tty.ops.flush(stream.tty);
        },flush:function (stream) {
          stream.tty.ops.flush(stream.tty);
        },read:function (stream, buffer, offset, length, pos /* ignored */) {
          if (!stream.tty || !stream.tty.ops.get_char) {
            throw new FS.ErrnoError(ERRNO_CODES.ENXIO);
          }
          var bytesRead = 0;
          for (var i = 0; i < length; i++) {
            var result;
            try {
              result = stream.tty.ops.get_char(stream.tty);
            } catch (e) {
              throw new FS.ErrnoError(ERRNO_CODES.EIO);
            }
            if (result === undefined && bytesRead === 0) {
              throw new FS.ErrnoError(ERRNO_CODES.EAGAIN);
            }
            if (result === null || result === undefined) break;
            bytesRead++;
            buffer[offset+i] = result;
          }
          if (bytesRead) {
            stream.node.timestamp = Date.now();
          }
          return bytesRead;
        },write:function (stream, buffer, offset, length, pos) {
          if (!stream.tty || !stream.tty.ops.put_char) {
            throw new FS.ErrnoError(ERRNO_CODES.ENXIO);
          }
          for (var i = 0; i < length; i++) {
            try {
              stream.tty.ops.put_char(stream.tty, buffer[offset+i]);
            } catch (e) {
              throw new FS.ErrnoError(ERRNO_CODES.EIO);
            }
          }
          if (length) {
            stream.node.timestamp = Date.now();
          }
          return i;
        }},default_tty_ops:{get_char:function (tty) {
          if (!tty.input.length) {
            var result = null;
            if (ENVIRONMENT_IS_NODE) {
              // we will read data by chunks of BUFSIZE
              var BUFSIZE = 256;
              var buf = new Buffer(BUFSIZE);
              var bytesRead = 0;
  
              var fd = process.stdin.fd;
              // Linux and Mac cannot use process.stdin.fd (which isn't set up as sync)
              var usingDevice = false;
              try {
                fd = fs.openSync('/dev/stdin', 'r');
                usingDevice = true;
              } catch (e) {}
  
              bytesRead = fs.readSync(fd, buf, 0, BUFSIZE, null);
  
              if (usingDevice) { fs.closeSync(fd); }
              if (bytesRead > 0) {
                result = buf.slice(0, bytesRead).toString('utf-8');
              } else {
                result = null;
              }
  
            } else if (typeof window != 'undefined' &&
              typeof window.prompt == 'function') {
              // Browser.
              result = window.prompt('Input: ');  // returns null on cancel
              if (result !== null) {
                result += '\n';
              }
            } else if (typeof readline == 'function') {
              // Command line.
              result = readline();
              if (result !== null) {
                result += '\n';
              }
            }
            if (!result) {
              return null;
            }
            tty.input = intArrayFromString(result, true);
          }
          return tty.input.shift();
        },put_char:function (tty, val) {
          if (val === null || val === 10) {
            Module['print'](UTF8ArrayToString(tty.output, 0));
            tty.output = [];
          } else {
            if (val != 0) tty.output.push(val); // val == 0 would cut text output off in the middle.
          }
        },flush:function (tty) {
          if (tty.output && tty.output.length > 0) {
            Module['print'](UTF8ArrayToString(tty.output, 0));
            tty.output = [];
          }
        }},default_tty1_ops:{put_char:function (tty, val) {
          if (val === null || val === 10) {
            Module['printErr'](UTF8ArrayToString(tty.output, 0));
            tty.output = [];
          } else {
            if (val != 0) tty.output.push(val);
          }
        },flush:function (tty) {
          if (tty.output && tty.output.length > 0) {
            Module['printErr'](UTF8ArrayToString(tty.output, 0));
            tty.output = [];
          }
        }}};
  
  var MEMFS={ops_table:null,mount:function (mount) {
        return MEMFS.createNode(null, '/', 16384 | 511 /* 0777 */, 0);
      },createNode:function (parent, name, mode, dev) {
        if (FS.isBlkdev(mode) || FS.isFIFO(mode)) {
          // no supported
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        if (!MEMFS.ops_table) {
          MEMFS.ops_table = {
            dir: {
              node: {
                getattr: MEMFS.node_ops.getattr,
                setattr: MEMFS.node_ops.setattr,
                lookup: MEMFS.node_ops.lookup,
                mknod: MEMFS.node_ops.mknod,
                rename: MEMFS.node_ops.rename,
                unlink: MEMFS.node_ops.unlink,
                rmdir: MEMFS.node_ops.rmdir,
                readdir: MEMFS.node_ops.readdir,
                symlink: MEMFS.node_ops.symlink
              },
              stream: {
                llseek: MEMFS.stream_ops.llseek
              }
            },
            file: {
              node: {
                getattr: MEMFS.node_ops.getattr,
                setattr: MEMFS.node_ops.setattr
              },
              stream: {
                llseek: MEMFS.stream_ops.llseek,
                read: MEMFS.stream_ops.read,
                write: MEMFS.stream_ops.write,
                allocate: MEMFS.stream_ops.allocate,
                mmap: MEMFS.stream_ops.mmap
              }
            },
            link: {
              node: {
                getattr: MEMFS.node_ops.getattr,
                setattr: MEMFS.node_ops.setattr,
                readlink: MEMFS.node_ops.readlink
              },
              stream: {}
            },
            chrdev: {
              node: {
                getattr: MEMFS.node_ops.getattr,
                setattr: MEMFS.node_ops.setattr
              },
              stream: FS.chrdev_stream_ops
            }
          };
        }
        var node = FS.createNode(parent, name, mode, dev);
        if (FS.isDir(node.mode)) {
          node.node_ops = MEMFS.ops_table.dir.node;
          node.stream_ops = MEMFS.ops_table.dir.stream;
          node.contents = {};
        } else if (FS.isFile(node.mode)) {
          node.node_ops = MEMFS.ops_table.file.node;
          node.stream_ops = MEMFS.ops_table.file.stream;
          node.usedBytes = 0; // The actual number of bytes used in the typed array, as opposed to contents.buffer.byteLength which gives the whole capacity.
          // When the byte data of the file is populated, this will point to either a typed array, or a normal JS array. Typed arrays are preferred
          // for performance, and used by default. However, typed arrays are not resizable like normal JS arrays are, so there is a small disk size
          // penalty involved for appending file writes that continuously grow a file similar to std::vector capacity vs used -scheme.
          node.contents = null; 
        } else if (FS.isLink(node.mode)) {
          node.node_ops = MEMFS.ops_table.link.node;
          node.stream_ops = MEMFS.ops_table.link.stream;
        } else if (FS.isChrdev(node.mode)) {
          node.node_ops = MEMFS.ops_table.chrdev.node;
          node.stream_ops = MEMFS.ops_table.chrdev.stream;
        }
        node.timestamp = Date.now();
        // add the new node to the parent
        if (parent) {
          parent.contents[name] = node;
        }
        return node;
      },getFileDataAsRegularArray:function (node) {
        if (node.contents && node.contents.subarray) {
          var arr = [];
          for (var i = 0; i < node.usedBytes; ++i) arr.push(node.contents[i]);
          return arr; // Returns a copy of the original data.
        }
        return node.contents; // No-op, the file contents are already in a JS array. Return as-is.
      },getFileDataAsTypedArray:function (node) {
        if (!node.contents) return new Uint8Array;
        if (node.contents.subarray) return node.contents.subarray(0, node.usedBytes); // Make sure to not return excess unused bytes.
        return new Uint8Array(node.contents);
      },expandFileStorage:function (node, newCapacity) {
  
        // If we are asked to expand the size of a file that already exists, revert to using a standard JS array to store the file
        // instead of a typed array. This makes resizing the array more flexible because we can just .push() elements at the back to
        // increase the size.
        if (node.contents && node.contents.subarray && newCapacity > node.contents.length) {
          node.contents = MEMFS.getFileDataAsRegularArray(node);
          node.usedBytes = node.contents.length; // We might be writing to a lazy-loaded file which had overridden this property, so force-reset it.
        }
  
        if (!node.contents || node.contents.subarray) { // Keep using a typed array if creating a new storage, or if old one was a typed array as well.
          var prevCapacity = node.contents ? node.contents.buffer.byteLength : 0;
          if (prevCapacity >= newCapacity) return; // No need to expand, the storage was already large enough.
          // Don't expand strictly to the given requested limit if it's only a very small increase, but instead geometrically grow capacity.
          // For small filesizes (<1MB), perform size*2 geometric increase, but for large sizes, do a much more conservative size*1.125 increase to
          // avoid overshooting the allocation cap by a very large margin.
          var CAPACITY_DOUBLING_MAX = 1024 * 1024;
          newCapacity = Math.max(newCapacity, (prevCapacity * (prevCapacity < CAPACITY_DOUBLING_MAX ? 2.0 : 1.125)) | 0);
          if (prevCapacity != 0) newCapacity = Math.max(newCapacity, 256); // At minimum allocate 256b for each file when expanding.
          var oldContents = node.contents;
          node.contents = new Uint8Array(newCapacity); // Allocate new storage.
          if (node.usedBytes > 0) node.contents.set(oldContents.subarray(0, node.usedBytes), 0); // Copy old data over to the new storage.
          return;
        }
        // Not using a typed array to back the file storage. Use a standard JS array instead.
        if (!node.contents && newCapacity > 0) node.contents = [];
        while (node.contents.length < newCapacity) node.contents.push(0);
      },resizeFileStorage:function (node, newSize) {
        if (node.usedBytes == newSize) return;
        if (newSize == 0) {
          node.contents = null; // Fully decommit when requesting a resize to zero.
          node.usedBytes = 0;
          return;
        }
  
        if (!node.contents || node.contents.subarray) { // Resize a typed array if that is being used as the backing store.
          var oldContents = node.contents;
          node.contents = new Uint8Array(new ArrayBuffer(newSize)); // Allocate new storage.
          if (oldContents) {
            node.contents.set(oldContents.subarray(0, Math.min(newSize, node.usedBytes))); // Copy old data over to the new storage.
          }
          node.usedBytes = newSize;
          return;
        }
        // Backing with a JS array.
        if (!node.contents) node.contents = [];
        if (node.contents.length > newSize) node.contents.length = newSize;
        else while (node.contents.length < newSize) node.contents.push(0);
        node.usedBytes = newSize;
      },node_ops:{getattr:function (node) {
          var attr = {};
          // device numbers reuse inode numbers.
          attr.dev = FS.isChrdev(node.mode) ? node.id : 1;
          attr.ino = node.id;
          attr.mode = node.mode;
          attr.nlink = 1;
          attr.uid = 0;
          attr.gid = 0;
          attr.rdev = node.rdev;
          if (FS.isDir(node.mode)) {
            attr.size = 4096;
          } else if (FS.isFile(node.mode)) {
            attr.size = node.usedBytes;
          } else if (FS.isLink(node.mode)) {
            attr.size = node.link.length;
          } else {
            attr.size = 0;
          }
          attr.atime = new Date(node.timestamp);
          attr.mtime = new Date(node.timestamp);
          attr.ctime = new Date(node.timestamp);
          // NOTE: In our implementation, st_blocks = Math.ceil(st_size/st_blksize),
          //       but this is not required by the standard.
          attr.blksize = 4096;
          attr.blocks = Math.ceil(attr.size / attr.blksize);
          return attr;
        },setattr:function (node, attr) {
          if (attr.mode !== undefined) {
            node.mode = attr.mode;
          }
          if (attr.timestamp !== undefined) {
            node.timestamp = attr.timestamp;
          }
          if (attr.size !== undefined) {
            MEMFS.resizeFileStorage(node, attr.size);
          }
        },lookup:function (parent, name) {
          throw FS.genericErrors[ERRNO_CODES.ENOENT];
        },mknod:function (parent, name, mode, dev) {
          return MEMFS.createNode(parent, name, mode, dev);
        },rename:function (old_node, new_dir, new_name) {
          // if we're overwriting a directory at new_name, make sure it's empty.
          if (FS.isDir(old_node.mode)) {
            var new_node;
            try {
              new_node = FS.lookupNode(new_dir, new_name);
            } catch (e) {
            }
            if (new_node) {
              for (var i in new_node.contents) {
                throw new FS.ErrnoError(ERRNO_CODES.ENOTEMPTY);
              }
            }
          }
          // do the internal rewiring
          delete old_node.parent.contents[old_node.name];
          old_node.name = new_name;
          new_dir.contents[new_name] = old_node;
          old_node.parent = new_dir;
        },unlink:function (parent, name) {
          delete parent.contents[name];
        },rmdir:function (parent, name) {
          var node = FS.lookupNode(parent, name);
          for (var i in node.contents) {
            throw new FS.ErrnoError(ERRNO_CODES.ENOTEMPTY);
          }
          delete parent.contents[name];
        },readdir:function (node) {
          var entries = ['.', '..']
          for (var key in node.contents) {
            if (!node.contents.hasOwnProperty(key)) {
              continue;
            }
            entries.push(key);
          }
          return entries;
        },symlink:function (parent, newname, oldpath) {
          var node = MEMFS.createNode(parent, newname, 511 /* 0777 */ | 40960, 0);
          node.link = oldpath;
          return node;
        },readlink:function (node) {
          if (!FS.isLink(node.mode)) {
            throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
          }
          return node.link;
        }},stream_ops:{read:function (stream, buffer, offset, length, position) {
          var contents = stream.node.contents;
          if (position >= stream.node.usedBytes) return 0;
          var size = Math.min(stream.node.usedBytes - position, length);
          assert(size >= 0);
          if (size > 8 && contents.subarray) { // non-trivial, and typed array
            buffer.set(contents.subarray(position, position + size), offset);
          } else
          {
            for (var i = 0; i < size; i++) buffer[offset + i] = contents[position + i];
          }
          return size;
        },write:function (stream, buffer, offset, length, position, canOwn) {
          if (!length) return 0;
          var node = stream.node;
          node.timestamp = Date.now();
  
          if (buffer.subarray && (!node.contents || node.contents.subarray)) { // This write is from a typed array to a typed array?
            if (canOwn) { // Can we just reuse the buffer we are given?
              assert(position === 0, 'canOwn must imply no weird position inside the file');
              node.contents = buffer.subarray(offset, offset + length);
              node.usedBytes = length;
              return length;
            } else if (node.usedBytes === 0 && position === 0) { // If this is a simple first write to an empty file, do a fast set since we don't need to care about old data.
              node.contents = new Uint8Array(buffer.subarray(offset, offset + length));
              node.usedBytes = length;
              return length;
            } else if (position + length <= node.usedBytes) { // Writing to an already allocated and used subrange of the file?
              node.contents.set(buffer.subarray(offset, offset + length), position);
              return length;
            }
          }
          // Appending to an existing file and we need to reallocate, or source data did not come as a typed array.
          MEMFS.expandFileStorage(node, position+length);
          if (node.contents.subarray && buffer.subarray) node.contents.set(buffer.subarray(offset, offset + length), position); // Use typed array write if available.
          else
            for (var i = 0; i < length; i++) {
             node.contents[position + i] = buffer[offset + i]; // Or fall back to manual write if not.
            }
          node.usedBytes = Math.max(node.usedBytes, position+length);
          return length;
        },llseek:function (stream, offset, whence) {
          var position = offset;
          if (whence === 1) {  // SEEK_CUR.
            position += stream.position;
          } else if (whence === 2) {  // SEEK_END.
            if (FS.isFile(stream.node.mode)) {
              position += stream.node.usedBytes;
            }
          }
          if (position < 0) {
            throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
          }
          return position;
        },allocate:function (stream, offset, length) {
          MEMFS.expandFileStorage(stream.node, offset + length);
          stream.node.usedBytes = Math.max(stream.node.usedBytes, offset + length);
        },mmap:function (stream, buffer, offset, length, position, prot, flags) {
          if (!FS.isFile(stream.node.mode)) {
            throw new FS.ErrnoError(ERRNO_CODES.ENODEV);
          }
          var ptr;
          var allocated;
          var contents = stream.node.contents;
          // Only make a new copy when MAP_PRIVATE is specified.
          if ( !(flags & 2) &&
                (contents.buffer === buffer || contents.buffer === buffer.buffer) ) {
            // We can't emulate MAP_SHARED when the file is not backed by the buffer
            // we're mapping to (e.g. the HEAP buffer).
            allocated = false;
            ptr = contents.byteOffset;
          } else {
            // Try to avoid unnecessary slices.
            if (position > 0 || position + length < stream.node.usedBytes) {
              if (contents.subarray) {
                contents = contents.subarray(position, position + length);
              } else {
                contents = Array.prototype.slice.call(contents, position, position + length);
              }
            }
            allocated = true;
            ptr = _malloc(length);
            if (!ptr) {
              throw new FS.ErrnoError(ERRNO_CODES.ENOMEM);
            }
            buffer.set(contents, ptr);
          }
          return { ptr: ptr, allocated: allocated };
        }}};
  
  var IDBFS={dbs:{},indexedDB:function () {
        if (typeof indexedDB !== 'undefined') return indexedDB;
        var ret = null;
        if (typeof window === 'object') ret = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
        assert(ret, 'IDBFS used, but indexedDB not supported');
        return ret;
      },DB_VERSION:21,DB_STORE_NAME:"FILE_DATA",mount:function (mount) {
        // reuse all of the core MEMFS functionality
        return MEMFS.mount.apply(null, arguments);
      },syncfs:function (mount, populate, callback) {
        IDBFS.getLocalSet(mount, function(err, local) {
          if (err) return callback(err);
  
          IDBFS.getRemoteSet(mount, function(err, remote) {
            if (err) return callback(err);
  
            var src = populate ? remote : local;
            var dst = populate ? local : remote;
  
            IDBFS.reconcile(src, dst, callback);
          });
        });
      },getDB:function (name, callback) {
        // check the cache first
        var db = IDBFS.dbs[name];
        if (db) {
          return callback(null, db);
        }
  
        var req;
        try {
          req = IDBFS.indexedDB().open(name, IDBFS.DB_VERSION);
        } catch (e) {
          return callback(e);
        }
        req.onupgradeneeded = function(e) {
          var db = e.target.result;
          var transaction = e.target.transaction;
  
          var fileStore;
  
          if (db.objectStoreNames.contains(IDBFS.DB_STORE_NAME)) {
            fileStore = transaction.objectStore(IDBFS.DB_STORE_NAME);
          } else {
            fileStore = db.createObjectStore(IDBFS.DB_STORE_NAME);
          }
  
          if (!fileStore.indexNames.contains('timestamp')) {
            fileStore.createIndex('timestamp', 'timestamp', { unique: false });
          }
        };
        req.onsuccess = function() {
          db = req.result;
  
          // add to the cache
          IDBFS.dbs[name] = db;
          callback(null, db);
        };
        req.onerror = function(e) {
          callback(this.error);
          e.preventDefault();
        };
      },getLocalSet:function (mount, callback) {
        var entries = {};
  
        function isRealDir(p) {
          return p !== '.' && p !== '..';
        };
        function toAbsolute(root) {
          return function(p) {
            return PATH.join2(root, p);
          }
        };
  
        var check = FS.readdir(mount.mountpoint).filter(isRealDir).map(toAbsolute(mount.mountpoint));
  
        while (check.length) {
          var path = check.pop();
          var stat;
  
          try {
            stat = FS.stat(path);
          } catch (e) {
            return callback(e);
          }
  
          if (FS.isDir(stat.mode)) {
            check.push.apply(check, FS.readdir(path).filter(isRealDir).map(toAbsolute(path)));
          }
  
          entries[path] = { timestamp: stat.mtime };
        }
  
        return callback(null, { type: 'local', entries: entries });
      },getRemoteSet:function (mount, callback) {
        var entries = {};
  
        IDBFS.getDB(mount.mountpoint, function(err, db) {
          if (err) return callback(err);
  
          var transaction = db.transaction([IDBFS.DB_STORE_NAME], 'readonly');
          transaction.onerror = function(e) {
            callback(this.error);
            e.preventDefault();
          };
  
          var store = transaction.objectStore(IDBFS.DB_STORE_NAME);
          var index = store.index('timestamp');
  
          index.openKeyCursor().onsuccess = function(event) {
            var cursor = event.target.result;
  
            if (!cursor) {
              return callback(null, { type: 'remote', db: db, entries: entries });
            }
  
            entries[cursor.primaryKey] = { timestamp: cursor.key };
  
            cursor.continue();
          };
        });
      },loadLocalEntry:function (path, callback) {
        var stat, node;
  
        try {
          var lookup = FS.lookupPath(path);
          node = lookup.node;
          stat = FS.stat(path);
        } catch (e) {
          return callback(e);
        }
  
        if (FS.isDir(stat.mode)) {
          return callback(null, { timestamp: stat.mtime, mode: stat.mode });
        } else if (FS.isFile(stat.mode)) {
          // Performance consideration: storing a normal JavaScript array to a IndexedDB is much slower than storing a typed array.
          // Therefore always convert the file contents to a typed array first before writing the data to IndexedDB.
          node.contents = MEMFS.getFileDataAsTypedArray(node);
          return callback(null, { timestamp: stat.mtime, mode: stat.mode, contents: node.contents });
        } else {
          return callback(new Error('node type not supported'));
        }
      },storeLocalEntry:function (path, entry, callback) {
        try {
          if (FS.isDir(entry.mode)) {
            FS.mkdir(path, entry.mode);
          } else if (FS.isFile(entry.mode)) {
            FS.writeFile(path, entry.contents, { encoding: 'binary', canOwn: true });
          } else {
            return callback(new Error('node type not supported'));
          }
  
          FS.chmod(path, entry.mode);
          FS.utime(path, entry.timestamp, entry.timestamp);
        } catch (e) {
          return callback(e);
        }
  
        callback(null);
      },removeLocalEntry:function (path, callback) {
        try {
          var lookup = FS.lookupPath(path);
          var stat = FS.stat(path);
  
          if (FS.isDir(stat.mode)) {
            FS.rmdir(path);
          } else if (FS.isFile(stat.mode)) {
            FS.unlink(path);
          }
        } catch (e) {
          return callback(e);
        }
  
        callback(null);
      },loadRemoteEntry:function (store, path, callback) {
        var req = store.get(path);
        req.onsuccess = function(event) { callback(null, event.target.result); };
        req.onerror = function(e) {
          callback(this.error);
          e.preventDefault();
        };
      },storeRemoteEntry:function (store, path, entry, callback) {
        var req = store.put(entry, path);
        req.onsuccess = function() { callback(null); };
        req.onerror = function(e) {
          callback(this.error);
          e.preventDefault();
        };
      },removeRemoteEntry:function (store, path, callback) {
        var req = store.delete(path);
        req.onsuccess = function() { callback(null); };
        req.onerror = function(e) {
          callback(this.error);
          e.preventDefault();
        };
      },reconcile:function (src, dst, callback) {
        var total = 0;
  
        var create = [];
        Object.keys(src.entries).forEach(function (key) {
          var e = src.entries[key];
          var e2 = dst.entries[key];
          if (!e2 || e.timestamp > e2.timestamp) {
            create.push(key);
            total++;
          }
        });
  
        var remove = [];
        Object.keys(dst.entries).forEach(function (key) {
          var e = dst.entries[key];
          var e2 = src.entries[key];
          if (!e2) {
            remove.push(key);
            total++;
          }
        });
  
        if (!total) {
          return callback(null);
        }
  
        var errored = false;
        var completed = 0;
        var db = src.type === 'remote' ? src.db : dst.db;
        var transaction = db.transaction([IDBFS.DB_STORE_NAME], 'readwrite');
        var store = transaction.objectStore(IDBFS.DB_STORE_NAME);
  
        function done(err) {
          if (err) {
            if (!done.errored) {
              done.errored = true;
              return callback(err);
            }
            return;
          }
          if (++completed >= total) {
            return callback(null);
          }
        };
  
        transaction.onerror = function(e) {
          done(this.error);
          e.preventDefault();
        };
  
        // sort paths in ascending order so directory entries are created
        // before the files inside them
        create.sort().forEach(function (path) {
          if (dst.type === 'local') {
            IDBFS.loadRemoteEntry(store, path, function (err, entry) {
              if (err) return done(err);
              IDBFS.storeLocalEntry(path, entry, done);
            });
          } else {
            IDBFS.loadLocalEntry(path, function (err, entry) {
              if (err) return done(err);
              IDBFS.storeRemoteEntry(store, path, entry, done);
            });
          }
        });
  
        // sort paths in descending order so files are deleted before their
        // parent directories
        remove.sort().reverse().forEach(function(path) {
          if (dst.type === 'local') {
            IDBFS.removeLocalEntry(path, done);
          } else {
            IDBFS.removeRemoteEntry(store, path, done);
          }
        });
      }};
  
  var NODEFS={isWindows:false,staticInit:function () {
        NODEFS.isWindows = !!process.platform.match(/^win/);
      },mount:function (mount) {
        assert(ENVIRONMENT_IS_NODE);
        return NODEFS.createNode(null, '/', NODEFS.getMode(mount.opts.root), 0);
      },createNode:function (parent, name, mode, dev) {
        if (!FS.isDir(mode) && !FS.isFile(mode) && !FS.isLink(mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        var node = FS.createNode(parent, name, mode);
        node.node_ops = NODEFS.node_ops;
        node.stream_ops = NODEFS.stream_ops;
        return node;
      },getMode:function (path) {
        var stat;
        try {
          stat = fs.lstatSync(path);
          if (NODEFS.isWindows) {
            // On Windows, directories return permission bits 'rw-rw-rw-', even though they have 'rwxrwxrwx', so 
            // propagate write bits to execute bits.
            stat.mode = stat.mode | ((stat.mode & 146) >> 1);
          }
        } catch (e) {
          if (!e.code) throw e;
          throw new FS.ErrnoError(ERRNO_CODES[e.code]);
        }
        return stat.mode;
      },realPath:function (node) {
        var parts = [];
        while (node.parent !== node) {
          parts.push(node.name);
          node = node.parent;
        }
        parts.push(node.mount.opts.root);
        parts.reverse();
        return PATH.join.apply(null, parts);
      },flagsToPermissionStringMap:{0:"r",1:"r+",2:"r+",64:"r",65:"r+",66:"r+",129:"rx+",193:"rx+",514:"w+",577:"w",578:"w+",705:"wx",706:"wx+",1024:"a",1025:"a",1026:"a+",1089:"a",1090:"a+",1153:"ax",1154:"ax+",1217:"ax",1218:"ax+",4096:"rs",4098:"rs+"},flagsToPermissionString:function (flags) {
        if (flags in NODEFS.flagsToPermissionStringMap) {
          return NODEFS.flagsToPermissionStringMap[flags];
        } else {
          return flags;
        }
      },node_ops:{getattr:function (node) {
          var path = NODEFS.realPath(node);
          var stat;
          try {
            stat = fs.lstatSync(path);
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
          // node.js v0.10.20 doesn't report blksize and blocks on Windows. Fake them with default blksize of 4096.
          // See http://support.microsoft.com/kb/140365
          if (NODEFS.isWindows && !stat.blksize) {
            stat.blksize = 4096;
          }
          if (NODEFS.isWindows && !stat.blocks) {
            stat.blocks = (stat.size+stat.blksize-1)/stat.blksize|0;
          }
          return {
            dev: stat.dev,
            ino: stat.ino,
            mode: stat.mode,
            nlink: stat.nlink,
            uid: stat.uid,
            gid: stat.gid,
            rdev: stat.rdev,
            size: stat.size,
            atime: stat.atime,
            mtime: stat.mtime,
            ctime: stat.ctime,
            blksize: stat.blksize,
            blocks: stat.blocks
          };
        },setattr:function (node, attr) {
          var path = NODEFS.realPath(node);
          try {
            if (attr.mode !== undefined) {
              fs.chmodSync(path, attr.mode);
              // update the common node structure mode as well
              node.mode = attr.mode;
            }
            if (attr.timestamp !== undefined) {
              var date = new Date(attr.timestamp);
              fs.utimesSync(path, date, date);
            }
            if (attr.size !== undefined) {
              fs.truncateSync(path, attr.size);
            }
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },lookup:function (parent, name) {
          var path = PATH.join2(NODEFS.realPath(parent), name);
          var mode = NODEFS.getMode(path);
          return NODEFS.createNode(parent, name, mode);
        },mknod:function (parent, name, mode, dev) {
          var node = NODEFS.createNode(parent, name, mode, dev);
          // create the backing node for this in the fs root as well
          var path = NODEFS.realPath(node);
          try {
            if (FS.isDir(node.mode)) {
              fs.mkdirSync(path, node.mode);
            } else {
              fs.writeFileSync(path, '', { mode: node.mode });
            }
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
          return node;
        },rename:function (oldNode, newDir, newName) {
          var oldPath = NODEFS.realPath(oldNode);
          var newPath = PATH.join2(NODEFS.realPath(newDir), newName);
          try {
            fs.renameSync(oldPath, newPath);
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },unlink:function (parent, name) {
          var path = PATH.join2(NODEFS.realPath(parent), name);
          try {
            fs.unlinkSync(path);
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },rmdir:function (parent, name) {
          var path = PATH.join2(NODEFS.realPath(parent), name);
          try {
            fs.rmdirSync(path);
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },readdir:function (node) {
          var path = NODEFS.realPath(node);
          try {
            return fs.readdirSync(path);
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },symlink:function (parent, newName, oldPath) {
          var newPath = PATH.join2(NODEFS.realPath(parent), newName);
          try {
            fs.symlinkSync(oldPath, newPath);
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },readlink:function (node) {
          var path = NODEFS.realPath(node);
          try {
            return fs.readlinkSync(path);
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        }},stream_ops:{open:function (stream) {
          var path = NODEFS.realPath(stream.node);
          try {
            if (FS.isFile(stream.node.mode)) {
              stream.nfd = fs.openSync(path, NODEFS.flagsToPermissionString(stream.flags));
            }
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },close:function (stream) {
          try {
            if (FS.isFile(stream.node.mode) && stream.nfd) {
              fs.closeSync(stream.nfd);
            }
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },read:function (stream, buffer, offset, length, position) {
          if (length === 0) return 0; // node errors on 0 length reads
          // FIXME this is terrible.
          var nbuffer = new Buffer(length);
          var res;
          try {
            res = fs.readSync(stream.nfd, nbuffer, 0, length, position);
          } catch (e) {
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
          if (res > 0) {
            for (var i = 0; i < res; i++) {
              buffer[offset + i] = nbuffer[i];
            }
          }
          return res;
        },write:function (stream, buffer, offset, length, position) {
          // FIXME this is terrible.
          var nbuffer = new Buffer(buffer.subarray(offset, offset + length));
          var res;
          try {
            res = fs.writeSync(stream.nfd, nbuffer, 0, length, position);
          } catch (e) {
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
          return res;
        },llseek:function (stream, offset, whence) {
          var position = offset;
          if (whence === 1) {  // SEEK_CUR.
            position += stream.position;
          } else if (whence === 2) {  // SEEK_END.
            if (FS.isFile(stream.node.mode)) {
              try {
                var stat = fs.fstatSync(stream.nfd);
                position += stat.size;
              } catch (e) {
                throw new FS.ErrnoError(ERRNO_CODES[e.code]);
              }
            }
          }
  
          if (position < 0) {
            throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
          }
  
          return position;
        }}};
  
  var _stdin=allocate(1, "i32*", ALLOC_STATIC);
  
  var _stdout=allocate(1, "i32*", ALLOC_STATIC);
  
  var _stderr=allocate(1, "i32*", ALLOC_STATIC);
  
  function _fflush(stream) {
      // int fflush(FILE *stream);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/fflush.html
  
      /*
      // Disabled, see https://github.com/kripken/emscripten/issues/2770
      stream = FS.getStreamFromPtr(stream);
      if (stream.stream_ops.flush) {
        stream.stream_ops.flush(stream);
      }
      */
    }var FS={root:null,mounts:[],devices:[null],streams:[],nextInode:1,nameTable:null,currentPath:"/",initialized:false,ignorePermissions:true,trackingDelegate:{},tracking:{openFlags:{READ:1,WRITE:2}},ErrnoError:null,genericErrors:{},handleFSError:function (e) {
        if (!(e instanceof FS.ErrnoError)) throw e + ' : ' + stackTrace();
        return ___setErrNo(e.errno);
      },lookupPath:function (path, opts) {
        path = PATH.resolve(FS.cwd(), path);
        opts = opts || {};
  
        if (!path) return { path: '', node: null };
  
        var defaults = {
          follow_mount: true,
          recurse_count: 0
        };
        for (var key in defaults) {
          if (opts[key] === undefined) {
            opts[key] = defaults[key];
          }
        }
  
        if (opts.recurse_count > 8) {  // max recursive lookup of 8
          throw new FS.ErrnoError(ERRNO_CODES.ELOOP);
        }
  
        // split the path
        var parts = PATH.normalizeArray(path.split('/').filter(function(p) {
          return !!p;
        }), false);
  
        // start at the root
        var current = FS.root;
        var current_path = '/';
  
        for (var i = 0; i < parts.length; i++) {
          var islast = (i === parts.length-1);
          if (islast && opts.parent) {
            // stop resolving
            break;
          }
  
          current = FS.lookupNode(current, parts[i]);
          current_path = PATH.join2(current_path, parts[i]);
  
          // jump to the mount's root node if this is a mountpoint
          if (FS.isMountpoint(current)) {
            if (!islast || (islast && opts.follow_mount)) {
              current = current.mounted.root;
            }
          }
  
          // by default, lookupPath will not follow a symlink if it is the final path component.
          // setting opts.follow = true will override this behavior.
          if (!islast || opts.follow) {
            var count = 0;
            while (FS.isLink(current.mode)) {
              var link = FS.readlink(current_path);
              current_path = PATH.resolve(PATH.dirname(current_path), link);
              
              var lookup = FS.lookupPath(current_path, { recurse_count: opts.recurse_count });
              current = lookup.node;
  
              if (count++ > 40) {  // limit max consecutive symlinks to 40 (SYMLOOP_MAX).
                throw new FS.ErrnoError(ERRNO_CODES.ELOOP);
              }
            }
          }
        }
  
        return { path: current_path, node: current };
      },getPath:function (node) {
        var path;
        while (true) {
          if (FS.isRoot(node)) {
            var mount = node.mount.mountpoint;
            if (!path) return mount;
            return mount[mount.length-1] !== '/' ? mount + '/' + path : mount + path;
          }
          path = path ? node.name + '/' + path : node.name;
          node = node.parent;
        }
      },hashName:function (parentid, name) {
        var hash = 0;
  
  
        for (var i = 0; i < name.length; i++) {
          hash = ((hash << 5) - hash + name.charCodeAt(i)) | 0;
        }
        return ((parentid + hash) >>> 0) % FS.nameTable.length;
      },hashAddNode:function (node) {
        var hash = FS.hashName(node.parent.id, node.name);
        node.name_next = FS.nameTable[hash];
        FS.nameTable[hash] = node;
      },hashRemoveNode:function (node) {
        var hash = FS.hashName(node.parent.id, node.name);
        if (FS.nameTable[hash] === node) {
          FS.nameTable[hash] = node.name_next;
        } else {
          var current = FS.nameTable[hash];
          while (current) {
            if (current.name_next === node) {
              current.name_next = node.name_next;
              break;
            }
            current = current.name_next;
          }
        }
      },lookupNode:function (parent, name) {
        var err = FS.mayLookup(parent);
        if (err) {
          throw new FS.ErrnoError(err, parent);
        }
        var hash = FS.hashName(parent.id, name);
        for (var node = FS.nameTable[hash]; node; node = node.name_next) {
          var nodeName = node.name;
          if (node.parent.id === parent.id && nodeName === name) {
            return node;
          }
        }
        // if we failed to find it in the cache, call into the VFS
        return FS.lookup(parent, name);
      },createNode:function (parent, name, mode, rdev) {
        if (!FS.FSNode) {
          FS.FSNode = function(parent, name, mode, rdev) {
            if (!parent) {
              parent = this;  // root node sets parent to itself
            }
            this.parent = parent;
            this.mount = parent.mount;
            this.mounted = null;
            this.id = FS.nextInode++;
            this.name = name;
            this.mode = mode;
            this.node_ops = {};
            this.stream_ops = {};
            this.rdev = rdev;
          };
  
          FS.FSNode.prototype = {};
  
          // compatibility
          var readMode = 292 | 73;
          var writeMode = 146;
  
          // NOTE we must use Object.defineProperties instead of individual calls to
          // Object.defineProperty in order to make closure compiler happy
          Object.defineProperties(FS.FSNode.prototype, {
            read: {
              get: function() { return (this.mode & readMode) === readMode; },
              set: function(val) { val ? this.mode |= readMode : this.mode &= ~readMode; }
            },
            write: {
              get: function() { return (this.mode & writeMode) === writeMode; },
              set: function(val) { val ? this.mode |= writeMode : this.mode &= ~writeMode; }
            },
            isFolder: {
              get: function() { return FS.isDir(this.mode); }
            },
            isDevice: {
              get: function() { return FS.isChrdev(this.mode); }
            }
          });
        }
  
        var node = new FS.FSNode(parent, name, mode, rdev);
  
        FS.hashAddNode(node);
  
        return node;
      },destroyNode:function (node) {
        FS.hashRemoveNode(node);
      },isRoot:function (node) {
        return node === node.parent;
      },isMountpoint:function (node) {
        return !!node.mounted;
      },isFile:function (mode) {
        return (mode & 61440) === 32768;
      },isDir:function (mode) {
        return (mode & 61440) === 16384;
      },isLink:function (mode) {
        return (mode & 61440) === 40960;
      },isChrdev:function (mode) {
        return (mode & 61440) === 8192;
      },isBlkdev:function (mode) {
        return (mode & 61440) === 24576;
      },isFIFO:function (mode) {
        return (mode & 61440) === 4096;
      },isSocket:function (mode) {
        return (mode & 49152) === 49152;
      },flagModes:{"r":0,"rs":1052672,"r+":2,"w":577,"wx":705,"xw":705,"w+":578,"wx+":706,"xw+":706,"a":1089,"ax":1217,"xa":1217,"a+":1090,"ax+":1218,"xa+":1218},modeStringToFlags:function (str) {
        var flags = FS.flagModes[str];
        if (typeof flags === 'undefined') {
          throw new Error('Unknown file open mode: ' + str);
        }
        return flags;
      },flagsToPermissionString:function (flag) {
        var accmode = flag & 2097155;
        var perms = ['r', 'w', 'rw'][accmode];
        if ((flag & 512)) {
          perms += 'w';
        }
        return perms;
      },nodePermissions:function (node, perms) {
        if (FS.ignorePermissions) {
          return 0;
        }
        // return 0 if any user, group or owner bits are set.
        if (perms.indexOf('r') !== -1 && !(node.mode & 292)) {
          return ERRNO_CODES.EACCES;
        } else if (perms.indexOf('w') !== -1 && !(node.mode & 146)) {
          return ERRNO_CODES.EACCES;
        } else if (perms.indexOf('x') !== -1 && !(node.mode & 73)) {
          return ERRNO_CODES.EACCES;
        }
        return 0;
      },mayLookup:function (dir) {
        var err = FS.nodePermissions(dir, 'x');
        if (err) return err;
        if (!dir.node_ops.lookup) return ERRNO_CODES.EACCES;
        return 0;
      },mayCreate:function (dir, name) {
        try {
          var node = FS.lookupNode(dir, name);
          return ERRNO_CODES.EEXIST;
        } catch (e) {
        }
        return FS.nodePermissions(dir, 'wx');
      },mayDelete:function (dir, name, isdir) {
        var node;
        try {
          node = FS.lookupNode(dir, name);
        } catch (e) {
          return e.errno;
        }
        var err = FS.nodePermissions(dir, 'wx');
        if (err) {
          return err;
        }
        if (isdir) {
          if (!FS.isDir(node.mode)) {
            return ERRNO_CODES.ENOTDIR;
          }
          if (FS.isRoot(node) || FS.getPath(node) === FS.cwd()) {
            return ERRNO_CODES.EBUSY;
          }
        } else {
          if (FS.isDir(node.mode)) {
            return ERRNO_CODES.EISDIR;
          }
        }
        return 0;
      },mayOpen:function (node, flags) {
        if (!node) {
          return ERRNO_CODES.ENOENT;
        }
        if (FS.isLink(node.mode)) {
          return ERRNO_CODES.ELOOP;
        } else if (FS.isDir(node.mode)) {
          if ((flags & 2097155) !== 0 ||  // opening for write
              (flags & 512)) {
            return ERRNO_CODES.EISDIR;
          }
        }
        return FS.nodePermissions(node, FS.flagsToPermissionString(flags));
      },MAX_OPEN_FDS:4096,nextfd:function (fd_start, fd_end) {
        fd_start = fd_start || 0;
        fd_end = fd_end || FS.MAX_OPEN_FDS;
        for (var fd = fd_start; fd <= fd_end; fd++) {
          if (!FS.streams[fd]) {
            return fd;
          }
        }
        throw new FS.ErrnoError(ERRNO_CODES.EMFILE);
      },getStream:function (fd) {
        return FS.streams[fd];
      },createStream:function (stream, fd_start, fd_end) {
        if (!FS.FSStream) {
          FS.FSStream = function(){};
          FS.FSStream.prototype = {};
          // compatibility
          Object.defineProperties(FS.FSStream.prototype, {
            object: {
              get: function() { return this.node; },
              set: function(val) { this.node = val; }
            },
            isRead: {
              get: function() { return (this.flags & 2097155) !== 1; }
            },
            isWrite: {
              get: function() { return (this.flags & 2097155) !== 0; }
            },
            isAppend: {
              get: function() { return (this.flags & 1024); }
            }
          });
        }
        // clone it, so we can return an instance of FSStream
        var newStream = new FS.FSStream();
        for (var p in stream) {
          newStream[p] = stream[p];
        }
        stream = newStream;
        var fd = FS.nextfd(fd_start, fd_end);
        stream.fd = fd;
        FS.streams[fd] = stream;
        return stream;
      },closeStream:function (fd) {
        FS.streams[fd] = null;
      },getStreamFromPtr:function (ptr) {
        return FS.streams[ptr - 1];
      },getPtrForStream:function (stream) {
        return stream ? stream.fd + 1 : 0;
      },chrdev_stream_ops:{open:function (stream) {
          var device = FS.getDevice(stream.node.rdev);
          // override node's stream ops with the device's
          stream.stream_ops = device.stream_ops;
          // forward the open call
          if (stream.stream_ops.open) {
            stream.stream_ops.open(stream);
          }
        },llseek:function () {
          throw new FS.ErrnoError(ERRNO_CODES.ESPIPE);
        }},major:function (dev) {
        return ((dev) >> 8);
      },minor:function (dev) {
        return ((dev) & 0xff);
      },makedev:function (ma, mi) {
        return ((ma) << 8 | (mi));
      },registerDevice:function (dev, ops) {
        FS.devices[dev] = { stream_ops: ops };
      },getDevice:function (dev) {
        return FS.devices[dev];
      },getMounts:function (mount) {
        var mounts = [];
        var check = [mount];
  
        while (check.length) {
          var m = check.pop();
  
          mounts.push(m);
  
          check.push.apply(check, m.mounts);
        }
  
        return mounts;
      },syncfs:function (populate, callback) {
        if (typeof(populate) === 'function') {
          callback = populate;
          populate = false;
        }
  
        var mounts = FS.getMounts(FS.root.mount);
        var completed = 0;
  
        function done(err) {
          if (err) {
            if (!done.errored) {
              done.errored = true;
              return callback(err);
            }
            return;
          }
          if (++completed >= mounts.length) {
            callback(null);
          }
        };
  
        // sync all mounts
        mounts.forEach(function (mount) {
          if (!mount.type.syncfs) {
            return done(null);
          }
          mount.type.syncfs(mount, populate, done);
        });
      },mount:function (type, opts, mountpoint) {
        var root = mountpoint === '/';
        var pseudo = !mountpoint;
        var node;
  
        if (root && FS.root) {
          throw new FS.ErrnoError(ERRNO_CODES.EBUSY);
        } else if (!root && !pseudo) {
          var lookup = FS.lookupPath(mountpoint, { follow_mount: false });
  
          mountpoint = lookup.path;  // use the absolute path
          node = lookup.node;
  
          if (FS.isMountpoint(node)) {
            throw new FS.ErrnoError(ERRNO_CODES.EBUSY);
          }
  
          if (!FS.isDir(node.mode)) {
            throw new FS.ErrnoError(ERRNO_CODES.ENOTDIR);
          }
        }
  
        var mount = {
          type: type,
          opts: opts,
          mountpoint: mountpoint,
          mounts: []
        };
  
        // create a root node for the fs
        var mountRoot = type.mount(mount);
        mountRoot.mount = mount;
        mount.root = mountRoot;
  
        if (root) {
          FS.root = mountRoot;
        } else if (node) {
          // set as a mountpoint
          node.mounted = mount;
  
          // add the new mount to the current mount's children
          if (node.mount) {
            node.mount.mounts.push(mount);
          }
        }
  
        return mountRoot;
      },unmount:function (mountpoint) {
        var lookup = FS.lookupPath(mountpoint, { follow_mount: false });
  
        if (!FS.isMountpoint(lookup.node)) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
  
        // destroy the nodes for this mount, and all its child mounts
        var node = lookup.node;
        var mount = node.mounted;
        var mounts = FS.getMounts(mount);
  
        Object.keys(FS.nameTable).forEach(function (hash) {
          var current = FS.nameTable[hash];
  
          while (current) {
            var next = current.name_next;
  
            if (mounts.indexOf(current.mount) !== -1) {
              FS.destroyNode(current);
            }
  
            current = next;
          }
        });
  
        // no longer a mountpoint
        node.mounted = null;
  
        // remove this mount from the child mounts
        var idx = node.mount.mounts.indexOf(mount);
        assert(idx !== -1);
        node.mount.mounts.splice(idx, 1);
      },lookup:function (parent, name) {
        return parent.node_ops.lookup(parent, name);
      },mknod:function (path, mode, dev) {
        var lookup = FS.lookupPath(path, { parent: true });
        var parent = lookup.node;
        var name = PATH.basename(path);
        if (!name || name === '.' || name === '..') {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        var err = FS.mayCreate(parent, name);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        if (!parent.node_ops.mknod) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        return parent.node_ops.mknod(parent, name, mode, dev);
      },create:function (path, mode) {
        mode = mode !== undefined ? mode : 438 /* 0666 */;
        mode &= 4095;
        mode |= 32768;
        return FS.mknod(path, mode, 0);
      },mkdir:function (path, mode) {
        mode = mode !== undefined ? mode : 511 /* 0777 */;
        mode &= 511 | 512;
        mode |= 16384;
        return FS.mknod(path, mode, 0);
      },mkdev:function (path, mode, dev) {
        if (typeof(dev) === 'undefined') {
          dev = mode;
          mode = 438 /* 0666 */;
        }
        mode |= 8192;
        return FS.mknod(path, mode, dev);
      },symlink:function (oldpath, newpath) {
        if (!PATH.resolve(oldpath)) {
          throw new FS.ErrnoError(ERRNO_CODES.ENOENT);
        }
        var lookup = FS.lookupPath(newpath, { parent: true });
        var parent = lookup.node;
        if (!parent) {
          throw new FS.ErrnoError(ERRNO_CODES.ENOENT);
        }
        var newname = PATH.basename(newpath);
        var err = FS.mayCreate(parent, newname);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        if (!parent.node_ops.symlink) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        return parent.node_ops.symlink(parent, newname, oldpath);
      },rename:function (old_path, new_path) {
        var old_dirname = PATH.dirname(old_path);
        var new_dirname = PATH.dirname(new_path);
        var old_name = PATH.basename(old_path);
        var new_name = PATH.basename(new_path);
        // parents must exist
        var lookup, old_dir, new_dir;
        try {
          lookup = FS.lookupPath(old_path, { parent: true });
          old_dir = lookup.node;
          lookup = FS.lookupPath(new_path, { parent: true });
          new_dir = lookup.node;
        } catch (e) {
          throw new FS.ErrnoError(ERRNO_CODES.EBUSY);
        }
        if (!old_dir || !new_dir) throw new FS.ErrnoError(ERRNO_CODES.ENOENT);
        // need to be part of the same mount
        if (old_dir.mount !== new_dir.mount) {
          throw new FS.ErrnoError(ERRNO_CODES.EXDEV);
        }
        // source must exist
        var old_node = FS.lookupNode(old_dir, old_name);
        // old path should not be an ancestor of the new path
        var relative = PATH.relative(old_path, new_dirname);
        if (relative.charAt(0) !== '.') {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        // new path should not be an ancestor of the old path
        relative = PATH.relative(new_path, old_dirname);
        if (relative.charAt(0) !== '.') {
          throw new FS.ErrnoError(ERRNO_CODES.ENOTEMPTY);
        }
        // see if the new path already exists
        var new_node;
        try {
          new_node = FS.lookupNode(new_dir, new_name);
        } catch (e) {
          // not fatal
        }
        // early out if nothing needs to change
        if (old_node === new_node) {
          return;
        }
        // we'll need to delete the old entry
        var isdir = FS.isDir(old_node.mode);
        var err = FS.mayDelete(old_dir, old_name, isdir);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        // need delete permissions if we'll be overwriting.
        // need create permissions if new doesn't already exist.
        err = new_node ?
          FS.mayDelete(new_dir, new_name, isdir) :
          FS.mayCreate(new_dir, new_name);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        if (!old_dir.node_ops.rename) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        if (FS.isMountpoint(old_node) || (new_node && FS.isMountpoint(new_node))) {
          throw new FS.ErrnoError(ERRNO_CODES.EBUSY);
        }
        // if we are going to change the parent, check write permissions
        if (new_dir !== old_dir) {
          err = FS.nodePermissions(old_dir, 'w');
          if (err) {
            throw new FS.ErrnoError(err);
          }
        }
        try {
          if (FS.trackingDelegate['willMovePath']) {
            FS.trackingDelegate['willMovePath'](old_path, new_path);
          }
        } catch(e) {
          console.log("FS.trackingDelegate['willMovePath']('"+old_path+"', '"+new_path+"') threw an exception: " + e.message);
        }
        // remove the node from the lookup hash
        FS.hashRemoveNode(old_node);
        // do the underlying fs rename
        try {
          old_dir.node_ops.rename(old_node, new_dir, new_name);
        } catch (e) {
          throw e;
        } finally {
          // add the node back to the hash (in case node_ops.rename
          // changed its name)
          FS.hashAddNode(old_node);
        }
        try {
          if (FS.trackingDelegate['onMovePath']) FS.trackingDelegate['onMovePath'](old_path, new_path);
        } catch(e) {
          console.log("FS.trackingDelegate['onMovePath']('"+old_path+"', '"+new_path+"') threw an exception: " + e.message);
        }
      },rmdir:function (path) {
        var lookup = FS.lookupPath(path, { parent: true });
        var parent = lookup.node;
        var name = PATH.basename(path);
        var node = FS.lookupNode(parent, name);
        var err = FS.mayDelete(parent, name, true);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        if (!parent.node_ops.rmdir) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        if (FS.isMountpoint(node)) {
          throw new FS.ErrnoError(ERRNO_CODES.EBUSY);
        }
        try {
          if (FS.trackingDelegate['willDeletePath']) {
            FS.trackingDelegate['willDeletePath'](path);
          }
        } catch(e) {
          console.log("FS.trackingDelegate['willDeletePath']('"+path+"') threw an exception: " + e.message);
        }
        parent.node_ops.rmdir(parent, name);
        FS.destroyNode(node);
        try {
          if (FS.trackingDelegate['onDeletePath']) FS.trackingDelegate['onDeletePath'](path);
        } catch(e) {
          console.log("FS.trackingDelegate['onDeletePath']('"+path+"') threw an exception: " + e.message);
        }
      },readdir:function (path) {
        var lookup = FS.lookupPath(path, { follow: true });
        var node = lookup.node;
        if (!node.node_ops.readdir) {
          throw new FS.ErrnoError(ERRNO_CODES.ENOTDIR);
        }
        return node.node_ops.readdir(node);
      },unlink:function (path) {
        var lookup = FS.lookupPath(path, { parent: true });
        var parent = lookup.node;
        var name = PATH.basename(path);
        var node = FS.lookupNode(parent, name);
        var err = FS.mayDelete(parent, name, false);
        if (err) {
          // POSIX says unlink should set EPERM, not EISDIR
          if (err === ERRNO_CODES.EISDIR) err = ERRNO_CODES.EPERM;
          throw new FS.ErrnoError(err);
        }
        if (!parent.node_ops.unlink) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        if (FS.isMountpoint(node)) {
          throw new FS.ErrnoError(ERRNO_CODES.EBUSY);
        }
        try {
          if (FS.trackingDelegate['willDeletePath']) {
            FS.trackingDelegate['willDeletePath'](path);
          }
        } catch(e) {
          console.log("FS.trackingDelegate['willDeletePath']('"+path+"') threw an exception: " + e.message);
        }
        parent.node_ops.unlink(parent, name);
        FS.destroyNode(node);
        try {
          if (FS.trackingDelegate['onDeletePath']) FS.trackingDelegate['onDeletePath'](path);
        } catch(e) {
          console.log("FS.trackingDelegate['onDeletePath']('"+path+"') threw an exception: " + e.message);
        }
      },readlink:function (path) {
        var lookup = FS.lookupPath(path);
        var link = lookup.node;
        if (!link) {
          throw new FS.ErrnoError(ERRNO_CODES.ENOENT);
        }
        if (!link.node_ops.readlink) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        return link.node_ops.readlink(link);
      },stat:function (path, dontFollow) {
        var lookup = FS.lookupPath(path, { follow: !dontFollow });
        var node = lookup.node;
        if (!node) {
          throw new FS.ErrnoError(ERRNO_CODES.ENOENT);
        }
        if (!node.node_ops.getattr) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        return node.node_ops.getattr(node);
      },lstat:function (path) {
        return FS.stat(path, true);
      },chmod:function (path, mode, dontFollow) {
        var node;
        if (typeof path === 'string') {
          var lookup = FS.lookupPath(path, { follow: !dontFollow });
          node = lookup.node;
        } else {
          node = path;
        }
        if (!node.node_ops.setattr) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        node.node_ops.setattr(node, {
          mode: (mode & 4095) | (node.mode & ~4095),
          timestamp: Date.now()
        });
      },lchmod:function (path, mode) {
        FS.chmod(path, mode, true);
      },fchmod:function (fd, mode) {
        var stream = FS.getStream(fd);
        if (!stream) {
          throw new FS.ErrnoError(ERRNO_CODES.EBADF);
        }
        FS.chmod(stream.node, mode);
      },chown:function (path, uid, gid, dontFollow) {
        var node;
        if (typeof path === 'string') {
          var lookup = FS.lookupPath(path, { follow: !dontFollow });
          node = lookup.node;
        } else {
          node = path;
        }
        if (!node.node_ops.setattr) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        node.node_ops.setattr(node, {
          timestamp: Date.now()
          // we ignore the uid / gid for now
        });
      },lchown:function (path, uid, gid) {
        FS.chown(path, uid, gid, true);
      },fchown:function (fd, uid, gid) {
        var stream = FS.getStream(fd);
        if (!stream) {
          throw new FS.ErrnoError(ERRNO_CODES.EBADF);
        }
        FS.chown(stream.node, uid, gid);
      },truncate:function (path, len) {
        if (len < 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        var node;
        if (typeof path === 'string') {
          var lookup = FS.lookupPath(path, { follow: true });
          node = lookup.node;
        } else {
          node = path;
        }
        if (!node.node_ops.setattr) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        if (FS.isDir(node.mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.EISDIR);
        }
        if (!FS.isFile(node.mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        var err = FS.nodePermissions(node, 'w');
        if (err) {
          throw new FS.ErrnoError(err);
        }
        node.node_ops.setattr(node, {
          size: len,
          timestamp: Date.now()
        });
      },ftruncate:function (fd, len) {
        var stream = FS.getStream(fd);
        if (!stream) {
          throw new FS.ErrnoError(ERRNO_CODES.EBADF);
        }
        if ((stream.flags & 2097155) === 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        FS.truncate(stream.node, len);
      },utime:function (path, atime, mtime) {
        var lookup = FS.lookupPath(path, { follow: true });
        var node = lookup.node;
        node.node_ops.setattr(node, {
          timestamp: Math.max(atime, mtime)
        });
      },open:function (path, flags, mode, fd_start, fd_end) {
        if (path === "") {
          throw new FS.ErrnoError(ERRNO_CODES.ENOENT);
        }
        flags = typeof flags === 'string' ? FS.modeStringToFlags(flags) : flags;
        mode = typeof mode === 'undefined' ? 438 /* 0666 */ : mode;
        if ((flags & 64)) {
          mode = (mode & 4095) | 32768;
        } else {
          mode = 0;
        }
        var node;
        if (typeof path === 'object') {
          node = path;
        } else {
          path = PATH.normalize(path);
          try {
            var lookup = FS.lookupPath(path, {
              follow: !(flags & 131072)
            });
            node = lookup.node;
          } catch (e) {
            // ignore
          }
        }
        // perhaps we need to create the node
        var created = false;
        if ((flags & 64)) {
          if (node) {
            // if O_CREAT and O_EXCL are set, error out if the node already exists
            if ((flags & 128)) {
              throw new FS.ErrnoError(ERRNO_CODES.EEXIST);
            }
          } else {
            // node doesn't exist, try to create it
            node = FS.mknod(path, mode, 0);
            created = true;
          }
        }
        if (!node) {
          throw new FS.ErrnoError(ERRNO_CODES.ENOENT);
        }
        // can't truncate a device
        if (FS.isChrdev(node.mode)) {
          flags &= ~512;
        }
        // check permissions, if this is not a file we just created now (it is ok to
        // create and write to a file with read-only permissions; it is read-only
        // for later use)
        if (!created) {
          var err = FS.mayOpen(node, flags);
          if (err) {
            throw new FS.ErrnoError(err);
          }
        }
        // do truncation if necessary
        if ((flags & 512)) {
          FS.truncate(node, 0);
        }
        // we've already handled these, don't pass down to the underlying vfs
        flags &= ~(128 | 512);
  
        // register the stream with the filesystem
        var stream = FS.createStream({
          node: node,
          path: FS.getPath(node),  // we want the absolute path to the node
          flags: flags,
          seekable: true,
          position: 0,
          stream_ops: node.stream_ops,
          // used by the file family libc calls (fopen, fwrite, ferror, etc.)
          ungotten: [],
          error: false
        }, fd_start, fd_end);
        // call the new stream's open function
        if (stream.stream_ops.open) {
          stream.stream_ops.open(stream);
        }
        if (Module['logReadFiles'] && !(flags & 1)) {
          if (!FS.readFiles) FS.readFiles = {};
          if (!(path in FS.readFiles)) {
            FS.readFiles[path] = 1;
            Module['printErr']('read file: ' + path);
          }
        }
        try {
          if (FS.trackingDelegate['onOpenFile']) {
            var trackingFlags = 0;
            if ((flags & 2097155) !== 1) {
              trackingFlags |= FS.tracking.openFlags.READ;
            }
            if ((flags & 2097155) !== 0) {
              trackingFlags |= FS.tracking.openFlags.WRITE;
            }
            FS.trackingDelegate['onOpenFile'](path, trackingFlags);
          }
        } catch(e) {
          console.log("FS.trackingDelegate['onOpenFile']('"+path+"', flags) threw an exception: " + e.message);
        }
        return stream;
      },close:function (stream) {
        try {
          if (stream.stream_ops.close) {
            stream.stream_ops.close(stream);
          }
        } catch (e) {
          throw e;
        } finally {
          FS.closeStream(stream.fd);
        }
      },llseek:function (stream, offset, whence) {
        if (!stream.seekable || !stream.stream_ops.llseek) {
          throw new FS.ErrnoError(ERRNO_CODES.ESPIPE);
        }
        stream.position = stream.stream_ops.llseek(stream, offset, whence);
        stream.ungotten = [];
        return stream.position;
      },read:function (stream, buffer, offset, length, position) {
        if (length < 0 || position < 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        if ((stream.flags & 2097155) === 1) {
          throw new FS.ErrnoError(ERRNO_CODES.EBADF);
        }
        if (FS.isDir(stream.node.mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.EISDIR);
        }
        if (!stream.stream_ops.read) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        var seeking = true;
        if (typeof position === 'undefined') {
          position = stream.position;
          seeking = false;
        } else if (!stream.seekable) {
          throw new FS.ErrnoError(ERRNO_CODES.ESPIPE);
        }
        var bytesRead = stream.stream_ops.read(stream, buffer, offset, length, position);
        if (!seeking) stream.position += bytesRead;
        return bytesRead;
      },write:function (stream, buffer, offset, length, position, canOwn) {
        if (length < 0 || position < 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        if ((stream.flags & 2097155) === 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EBADF);
        }
        if (FS.isDir(stream.node.mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.EISDIR);
        }
        if (!stream.stream_ops.write) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        if (stream.flags & 1024) {
          // seek to the end before writing in append mode
          FS.llseek(stream, 0, 2);
        }
        var seeking = true;
        if (typeof position === 'undefined') {
          position = stream.position;
          seeking = false;
        } else if (!stream.seekable) {
          throw new FS.ErrnoError(ERRNO_CODES.ESPIPE);
        }
        var bytesWritten = stream.stream_ops.write(stream, buffer, offset, length, position, canOwn);
        if (!seeking) stream.position += bytesWritten;
        try {
          if (stream.path && FS.trackingDelegate['onWriteToFile']) FS.trackingDelegate['onWriteToFile'](stream.path);
        } catch(e) {
          console.log("FS.trackingDelegate['onWriteToFile']('"+path+"') threw an exception: " + e.message);
        }
        return bytesWritten;
      },allocate:function (stream, offset, length) {
        if (offset < 0 || length <= 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        if ((stream.flags & 2097155) === 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EBADF);
        }
        if (!FS.isFile(stream.node.mode) && !FS.isDir(node.mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.ENODEV);
        }
        if (!stream.stream_ops.allocate) {
          throw new FS.ErrnoError(ERRNO_CODES.EOPNOTSUPP);
        }
        stream.stream_ops.allocate(stream, offset, length);
      },mmap:function (stream, buffer, offset, length, position, prot, flags) {
        // TODO if PROT is PROT_WRITE, make sure we have write access
        if ((stream.flags & 2097155) === 1) {
          throw new FS.ErrnoError(ERRNO_CODES.EACCES);
        }
        if (!stream.stream_ops.mmap) {
          throw new FS.ErrnoError(ERRNO_CODES.ENODEV);
        }
        return stream.stream_ops.mmap(stream, buffer, offset, length, position, prot, flags);
      },ioctl:function (stream, cmd, arg) {
        if (!stream.stream_ops.ioctl) {
          throw new FS.ErrnoError(ERRNO_CODES.ENOTTY);
        }
        return stream.stream_ops.ioctl(stream, cmd, arg);
      },readFile:function (path, opts) {
        opts = opts || {};
        opts.flags = opts.flags || 'r';
        opts.encoding = opts.encoding || 'binary';
        if (opts.encoding !== 'utf8' && opts.encoding !== 'binary') {
          throw new Error('Invalid encoding type "' + opts.encoding + '"');
        }
        var ret;
        var stream = FS.open(path, opts.flags);
        var stat = FS.stat(path);
        var length = stat.size;
        var buf = new Uint8Array(length);
        FS.read(stream, buf, 0, length, 0);
        if (opts.encoding === 'utf8') {
          ret = UTF8ArrayToString(buf, 0);
        } else if (opts.encoding === 'binary') {
          ret = buf;
        }
        FS.close(stream);
        return ret;
      },writeFile:function (path, data, opts) {
        opts = opts || {};
        opts.flags = opts.flags || 'w';
        opts.encoding = opts.encoding || 'utf8';
        if (opts.encoding !== 'utf8' && opts.encoding !== 'binary') {
          throw new Error('Invalid encoding type "' + opts.encoding + '"');
        }
        var stream = FS.open(path, opts.flags, opts.mode);
        if (opts.encoding === 'utf8') {
          var buf = new Uint8Array(lengthBytesUTF8(data)+1);
          var actualNumBytes = stringToUTF8Array(data, buf, 0, buf.length);
          FS.write(stream, buf, 0, actualNumBytes, 0, opts.canOwn);
        } else if (opts.encoding === 'binary') {
          FS.write(stream, data, 0, data.length, 0, opts.canOwn);
        }
        FS.close(stream);
      },cwd:function () {
        return FS.currentPath;
      },chdir:function (path) {
        var lookup = FS.lookupPath(path, { follow: true });
        if (!FS.isDir(lookup.node.mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.ENOTDIR);
        }
        var err = FS.nodePermissions(lookup.node, 'x');
        if (err) {
          throw new FS.ErrnoError(err);
        }
        FS.currentPath = lookup.path;
      },createDefaultDirectories:function () {
        FS.mkdir('/tmp');
        FS.mkdir('/home');
        FS.mkdir('/home/web_user');
      },createDefaultDevices:function () {
        // create /dev
        FS.mkdir('/dev');
        // setup /dev/null
        FS.registerDevice(FS.makedev(1, 3), {
          read: function() { return 0; },
          write: function() { return 0; }
        });
        FS.mkdev('/dev/null', FS.makedev(1, 3));
        // setup /dev/tty and /dev/tty1
        // stderr needs to print output using Module['printErr']
        // so we register a second tty just for it.
        TTY.register(FS.makedev(5, 0), TTY.default_tty_ops);
        TTY.register(FS.makedev(6, 0), TTY.default_tty1_ops);
        FS.mkdev('/dev/tty', FS.makedev(5, 0));
        FS.mkdev('/dev/tty1', FS.makedev(6, 0));
        // setup /dev/[u]random
        var random_device;
        if (typeof crypto !== 'undefined') {
          // for modern web browsers
          var randomBuffer = new Uint8Array(1);
          random_device = function() { crypto.getRandomValues(randomBuffer); return randomBuffer[0]; };
        } else if (ENVIRONMENT_IS_NODE) {
          // for nodejs
          random_device = function() { return require('crypto').randomBytes(1)[0]; };
        } else {
          // default for ES5 platforms
          random_device = function() { return (Math.random()*256)|0; };
        }
        FS.createDevice('/dev', 'random', random_device);
        FS.createDevice('/dev', 'urandom', random_device);
        // we're not going to emulate the actual shm device,
        // just create the tmp dirs that reside in it commonly
        FS.mkdir('/dev/shm');
        FS.mkdir('/dev/shm/tmp');
      },createStandardStreams:function () {
        // TODO deprecate the old functionality of a single
        // input / output callback and that utilizes FS.createDevice
        // and instead require a unique set of stream ops
  
        // by default, we symlink the standard streams to the
        // default tty devices. however, if the standard streams
        // have been overwritten we create a unique device for
        // them instead.
        if (Module['stdin']) {
          FS.createDevice('/dev', 'stdin', Module['stdin']);
        } else {
          FS.symlink('/dev/tty', '/dev/stdin');
        }
        if (Module['stdout']) {
          FS.createDevice('/dev', 'stdout', null, Module['stdout']);
        } else {
          FS.symlink('/dev/tty', '/dev/stdout');
        }
        if (Module['stderr']) {
          FS.createDevice('/dev', 'stderr', null, Module['stderr']);
        } else {
          FS.symlink('/dev/tty1', '/dev/stderr');
        }
  
        // open default streams for the stdin, stdout and stderr devices
        var stdin = FS.open('/dev/stdin', 'r');
        HEAP32[((_stdin)>>2)]=FS.getPtrForStream(stdin);
        assert(stdin.fd === 0, 'invalid handle for stdin (' + stdin.fd + ')');
  
        var stdout = FS.open('/dev/stdout', 'w');
        HEAP32[((_stdout)>>2)]=FS.getPtrForStream(stdout);
        assert(stdout.fd === 1, 'invalid handle for stdout (' + stdout.fd + ')');
  
        var stderr = FS.open('/dev/stderr', 'w');
        HEAP32[((_stderr)>>2)]=FS.getPtrForStream(stderr);
        assert(stderr.fd === 2, 'invalid handle for stderr (' + stderr.fd + ')');
      },ensureErrnoError:function () {
        if (FS.ErrnoError) return;
        FS.ErrnoError = function ErrnoError(errno, node) {
          this.node = node;
          this.setErrno = function(errno) {
            this.errno = errno;
            for (var key in ERRNO_CODES) {
              if (ERRNO_CODES[key] === errno) {
                this.code = key;
                break;
              }
            }
          };
          this.setErrno(errno);
          this.message = ERRNO_MESSAGES[errno];
          if (this.stack) this.stack = demangleAll(this.stack);
        };
        FS.ErrnoError.prototype = new Error();
        FS.ErrnoError.prototype.constructor = FS.ErrnoError;
        // Some errors may happen quite a bit, to avoid overhead we reuse them (and suffer a lack of stack info)
        [ERRNO_CODES.ENOENT].forEach(function(code) {
          FS.genericErrors[code] = new FS.ErrnoError(code);
          FS.genericErrors[code].stack = '<generic error, no stack>';
        });
      },staticInit:function () {
        FS.ensureErrnoError();
  
        FS.nameTable = new Array(4096);
  
        FS.mount(MEMFS, {}, '/');
  
        FS.createDefaultDirectories();
        FS.createDefaultDevices();
      },init:function (input, output, error) {
        assert(!FS.init.initialized, 'FS.init was previously called. If you want to initialize later with custom parameters, remove any earlier calls (note that one is automatically added to the generated code)');
        FS.init.initialized = true;
  
        FS.ensureErrnoError();
  
        // Allow Module.stdin etc. to provide defaults, if none explicitly passed to us here
        Module['stdin'] = input || Module['stdin'];
        Module['stdout'] = output || Module['stdout'];
        Module['stderr'] = error || Module['stderr'];
  
        FS.createStandardStreams();
      },quit:function () {
        FS.init.initialized = false;
        for (var i = 0; i < FS.streams.length; i++) {
          var stream = FS.streams[i];
          if (!stream) {
            continue;
          }
          FS.close(stream);
        }
      },getMode:function (canRead, canWrite) {
        var mode = 0;
        if (canRead) mode |= 292 | 73;
        if (canWrite) mode |= 146;
        return mode;
      },joinPath:function (parts, forceRelative) {
        var path = PATH.join.apply(null, parts);
        if (forceRelative && path[0] == '/') path = path.substr(1);
        return path;
      },absolutePath:function (relative, base) {
        return PATH.resolve(base, relative);
      },standardizePath:function (path) {
        return PATH.normalize(path);
      },findObject:function (path, dontResolveLastLink) {
        var ret = FS.analyzePath(path, dontResolveLastLink);
        if (ret.exists) {
          return ret.object;
        } else {
          ___setErrNo(ret.error);
          return null;
        }
      },analyzePath:function (path, dontResolveLastLink) {
        // operate from within the context of the symlink's target
        try {
          var lookup = FS.lookupPath(path, { follow: !dontResolveLastLink });
          path = lookup.path;
        } catch (e) {
        }
        var ret = {
          isRoot: false, exists: false, error: 0, name: null, path: null, object: null,
          parentExists: false, parentPath: null, parentObject: null
        };
        try {
          var lookup = FS.lookupPath(path, { parent: true });
          ret.parentExists = true;
          ret.parentPath = lookup.path;
          ret.parentObject = lookup.node;
          ret.name = PATH.basename(path);
          lookup = FS.lookupPath(path, { follow: !dontResolveLastLink });
          ret.exists = true;
          ret.path = lookup.path;
          ret.object = lookup.node;
          ret.name = lookup.node.name;
          ret.isRoot = lookup.path === '/';
        } catch (e) {
          ret.error = e.errno;
        };
        return ret;
      },createFolder:function (parent, name, canRead, canWrite) {
        var path = PATH.join2(typeof parent === 'string' ? parent : FS.getPath(parent), name);
        var mode = FS.getMode(canRead, canWrite);
        return FS.mkdir(path, mode);
      },createPath:function (parent, path, canRead, canWrite) {
        parent = typeof parent === 'string' ? parent : FS.getPath(parent);
        var parts = path.split('/').reverse();
        while (parts.length) {
          var part = parts.pop();
          if (!part) continue;
          var current = PATH.join2(parent, part);
          try {
            FS.mkdir(current);
          } catch (e) {
            // ignore EEXIST
          }
          parent = current;
        }
        return current;
      },createFile:function (parent, name, properties, canRead, canWrite) {
        var path = PATH.join2(typeof parent === 'string' ? parent : FS.getPath(parent), name);
        var mode = FS.getMode(canRead, canWrite);
        return FS.create(path, mode);
      },createDataFile:function (parent, name, data, canRead, canWrite, canOwn) {
        var path = name ? PATH.join2(typeof parent === 'string' ? parent : FS.getPath(parent), name) : parent;
        var mode = FS.getMode(canRead, canWrite);
        var node = FS.create(path, mode);
        if (data) {
          if (typeof data === 'string') {
            var arr = new Array(data.length);
            for (var i = 0, len = data.length; i < len; ++i) arr[i] = data.charCodeAt(i);
            data = arr;
          }
          // make sure we can write to the file
          FS.chmod(node, mode | 146);
          var stream = FS.open(node, 'w');
          FS.write(stream, data, 0, data.length, 0, canOwn);
          FS.close(stream);
          FS.chmod(node, mode);
        }
        return node;
      },createDevice:function (parent, name, input, output) {
        var path = PATH.join2(typeof parent === 'string' ? parent : FS.getPath(parent), name);
        var mode = FS.getMode(!!input, !!output);
        if (!FS.createDevice.major) FS.createDevice.major = 64;
        var dev = FS.makedev(FS.createDevice.major++, 0);
        // Create a fake device that a set of stream ops to emulate
        // the old behavior.
        FS.registerDevice(dev, {
          open: function(stream) {
            stream.seekable = false;
          },
          close: function(stream) {
            // flush any pending line data
            if (output && output.buffer && output.buffer.length) {
              output(10);
            }
          },
          read: function(stream, buffer, offset, length, pos /* ignored */) {
            var bytesRead = 0;
            for (var i = 0; i < length; i++) {
              var result;
              try {
                result = input();
              } catch (e) {
                throw new FS.ErrnoError(ERRNO_CODES.EIO);
              }
              if (result === undefined && bytesRead === 0) {
                throw new FS.ErrnoError(ERRNO_CODES.EAGAIN);
              }
              if (result === null || result === undefined) break;
              bytesRead++;
              buffer[offset+i] = result;
            }
            if (bytesRead) {
              stream.node.timestamp = Date.now();
            }
            return bytesRead;
          },
          write: function(stream, buffer, offset, length, pos) {
            for (var i = 0; i < length; i++) {
              try {
                output(buffer[offset+i]);
              } catch (e) {
                throw new FS.ErrnoError(ERRNO_CODES.EIO);
              }
            }
            if (length) {
              stream.node.timestamp = Date.now();
            }
            return i;
          }
        });
        return FS.mkdev(path, mode, dev);
      },createLink:function (parent, name, target, canRead, canWrite) {
        var path = PATH.join2(typeof parent === 'string' ? parent : FS.getPath(parent), name);
        return FS.symlink(target, path);
      },forceLoadFile:function (obj) {
        if (obj.isDevice || obj.isFolder || obj.link || obj.contents) return true;
        var success = true;
        if (typeof XMLHttpRequest !== 'undefined') {
          throw new Error("Lazy loading should have been performed (contents set) in createLazyFile, but it was not. Lazy loading only works in web workers. Use --embed-file or --preload-file in emcc on the main thread.");
        } else if (Module['read']) {
          // Command-line.
          try {
            // WARNING: Can't read binary files in V8's d8 or tracemonkey's js, as
            //          read() will try to parse UTF8.
            obj.contents = intArrayFromString(Module['read'](obj.url), true);
            obj.usedBytes = obj.contents.length;
          } catch (e) {
            success = false;
          }
        } else {
          throw new Error('Cannot load without read() or XMLHttpRequest.');
        }
        if (!success) ___setErrNo(ERRNO_CODES.EIO);
        return success;
      },createLazyFile:function (parent, name, url, canRead, canWrite) {
        // Lazy chunked Uint8Array (implements get and length from Uint8Array). Actual getting is abstracted away for eventual reuse.
        function LazyUint8Array() {
          this.lengthKnown = false;
          this.chunks = []; // Loaded chunks. Index is the chunk number
        }
        LazyUint8Array.prototype.get = function LazyUint8Array_get(idx) {
          if (idx > this.length-1 || idx < 0) {
            return undefined;
          }
          var chunkOffset = idx % this.chunkSize;
          var chunkNum = (idx / this.chunkSize)|0;
          return this.getter(chunkNum)[chunkOffset];
        }
        LazyUint8Array.prototype.setDataGetter = function LazyUint8Array_setDataGetter(getter) {
          this.getter = getter;
        }
        LazyUint8Array.prototype.cacheLength = function LazyUint8Array_cacheLength() {
          // Find length
          var xhr = new XMLHttpRequest();
          xhr.open('HEAD', url, false);
          xhr.send(null);
          if (!(xhr.status >= 200 && xhr.status < 300 || xhr.status === 304)) throw new Error("Couldn't load " + url + ". Status: " + xhr.status);
          var datalength = Number(xhr.getResponseHeader("Content-length"));
          var header;
          var hasByteServing = (header = xhr.getResponseHeader("Accept-Ranges")) && header === "bytes";
          var chunkSize = 1024*1024; // Chunk size in bytes
  
          if (!hasByteServing) chunkSize = datalength;
  
          // Function to get a range from the remote URL.
          var doXHR = (function(from, to) {
            if (from > to) throw new Error("invalid range (" + from + ", " + to + ") or no bytes requested!");
            if (to > datalength-1) throw new Error("only " + datalength + " bytes available! programmer error!");
  
            // TODO: Use mozResponseArrayBuffer, responseStream, etc. if available.
            var xhr = new XMLHttpRequest();
            xhr.open('GET', url, false);
            if (datalength !== chunkSize) xhr.setRequestHeader("Range", "bytes=" + from + "-" + to);
  
            // Some hints to the browser that we want binary data.
            if (typeof Uint8Array != 'undefined') xhr.responseType = 'arraybuffer';
            if (xhr.overrideMimeType) {
              xhr.overrideMimeType('text/plain; charset=x-user-defined');
            }
  
            xhr.send(null);
            if (!(xhr.status >= 200 && xhr.status < 300 || xhr.status === 304)) throw new Error("Couldn't load " + url + ". Status: " + xhr.status);
            if (xhr.response !== undefined) {
              return new Uint8Array(xhr.response || []);
            } else {
              return intArrayFromString(xhr.responseText || '', true);
            }
          });
          var lazyArray = this;
          lazyArray.setDataGetter(function(chunkNum) {
            var start = chunkNum * chunkSize;
            var end = (chunkNum+1) * chunkSize - 1; // including this byte
            end = Math.min(end, datalength-1); // if datalength-1 is selected, this is the last block
            if (typeof(lazyArray.chunks[chunkNum]) === "undefined") {
              lazyArray.chunks[chunkNum] = doXHR(start, end);
            }
            if (typeof(lazyArray.chunks[chunkNum]) === "undefined") throw new Error("doXHR failed!");
            return lazyArray.chunks[chunkNum];
          });
  
          this._length = datalength;
          this._chunkSize = chunkSize;
          this.lengthKnown = true;
        }
        if (typeof XMLHttpRequest !== 'undefined') {
          if (!ENVIRONMENT_IS_WORKER) throw 'Cannot do synchronous binary XHRs outside webworkers in modern browsers. Use --embed-file or --preload-file in emcc';
          var lazyArray = new LazyUint8Array();
          Object.defineProperty(lazyArray, "length", {
              get: function() {
                  if(!this.lengthKnown) {
                      this.cacheLength();
                  }
                  return this._length;
              }
          });
          Object.defineProperty(lazyArray, "chunkSize", {
              get: function() {
                  if(!this.lengthKnown) {
                      this.cacheLength();
                  }
                  return this._chunkSize;
              }
          });
  
          var properties = { isDevice: false, contents: lazyArray };
        } else {
          var properties = { isDevice: false, url: url };
        }
  
        var node = FS.createFile(parent, name, properties, canRead, canWrite);
        // This is a total hack, but I want to get this lazy file code out of the
        // core of MEMFS. If we want to keep this lazy file concept I feel it should
        // be its own thin LAZYFS proxying calls to MEMFS.
        if (properties.contents) {
          node.contents = properties.contents;
        } else if (properties.url) {
          node.contents = null;
          node.url = properties.url;
        }
        // Add a function that defers querying the file size until it is asked the first time.
        Object.defineProperty(node, "usedBytes", {
            get: function() { return this.contents.length; }
        });
        // override each stream op with one that tries to force load the lazy file first
        var stream_ops = {};
        var keys = Object.keys(node.stream_ops);
        keys.forEach(function(key) {
          var fn = node.stream_ops[key];
          stream_ops[key] = function forceLoadLazyFile() {
            if (!FS.forceLoadFile(node)) {
              throw new FS.ErrnoError(ERRNO_CODES.EIO);
            }
            return fn.apply(null, arguments);
          };
        });
        // use a custom read function
        stream_ops.read = function stream_ops_read(stream, buffer, offset, length, position) {
          if (!FS.forceLoadFile(node)) {
            throw new FS.ErrnoError(ERRNO_CODES.EIO);
          }
          var contents = stream.node.contents;
          if (position >= contents.length)
            return 0;
          var size = Math.min(contents.length - position, length);
          assert(size >= 0);
          if (contents.slice) { // normal array
            for (var i = 0; i < size; i++) {
              buffer[offset + i] = contents[position + i];
            }
          } else {
            for (var i = 0; i < size; i++) { // LazyUint8Array from sync binary XHR
              buffer[offset + i] = contents.get(position + i);
            }
          }
          return size;
        };
        node.stream_ops = stream_ops;
        return node;
      },createPreloadedFile:function (parent, name, url, canRead, canWrite, onload, onerror, dontCreateFile, canOwn) {
        Browser.init();
        // TODO we should allow people to just pass in a complete filename instead
        // of parent and name being that we just join them anyways
        var fullname = name ? PATH.resolve(PATH.join2(parent, name)) : parent;
        function processData(byteArray) {
          function finish(byteArray) {
            if (!dontCreateFile) {
              FS.createDataFile(parent, name, byteArray, canRead, canWrite, canOwn);
            }
            if (onload) onload();
            removeRunDependency('cp ' + fullname);
          }
          var handled = false;
          Module['preloadPlugins'].forEach(function(plugin) {
            if (handled) return;
            if (plugin['canHandle'](fullname)) {
              plugin['handle'](byteArray, fullname, finish, function() {
                if (onerror) onerror();
                removeRunDependency('cp ' + fullname);
              });
              handled = true;
            }
          });
          if (!handled) finish(byteArray);
        }
        addRunDependency('cp ' + fullname);
        if (typeof url == 'string') {
          Browser.asyncLoad(url, function(byteArray) {
            processData(byteArray);
          }, onerror);
        } else {
          processData(url);
        }
      },indexedDB:function () {
        return window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
      },DB_NAME:function () {
        return 'EM_FS_' + window.location.pathname;
      },DB_VERSION:20,DB_STORE_NAME:"FILE_DATA",saveFilesToDB:function (paths, onload, onerror) {
        onload = onload || function(){};
        onerror = onerror || function(){};
        var indexedDB = FS.indexedDB();
        try {
          var openRequest = indexedDB.open(FS.DB_NAME(), FS.DB_VERSION);
        } catch (e) {
          return onerror(e);
        }
        openRequest.onupgradeneeded = function openRequest_onupgradeneeded() {
          console.log('creating db');
          var db = openRequest.result;
          db.createObjectStore(FS.DB_STORE_NAME);
        };
        openRequest.onsuccess = function openRequest_onsuccess() {
          var db = openRequest.result;
          var transaction = db.transaction([FS.DB_STORE_NAME], 'readwrite');
          var files = transaction.objectStore(FS.DB_STORE_NAME);
          var ok = 0, fail = 0, total = paths.length;
          function finish() {
            if (fail == 0) onload(); else onerror();
          }
          paths.forEach(function(path) {
            var putRequest = files.put(FS.analyzePath(path).object.contents, path);
            putRequest.onsuccess = function putRequest_onsuccess() { ok++; if (ok + fail == total) finish() };
            putRequest.onerror = function putRequest_onerror() { fail++; if (ok + fail == total) finish() };
          });
          transaction.onerror = onerror;
        };
        openRequest.onerror = onerror;
      },loadFilesFromDB:function (paths, onload, onerror) {
        onload = onload || function(){};
        onerror = onerror || function(){};
        var indexedDB = FS.indexedDB();
        try {
          var openRequest = indexedDB.open(FS.DB_NAME(), FS.DB_VERSION);
        } catch (e) {
          return onerror(e);
        }
        openRequest.onupgradeneeded = onerror; // no database to load from
        openRequest.onsuccess = function openRequest_onsuccess() {
          var db = openRequest.result;
          try {
            var transaction = db.transaction([FS.DB_STORE_NAME], 'readonly');
          } catch(e) {
            onerror(e);
            return;
          }
          var files = transaction.objectStore(FS.DB_STORE_NAME);
          var ok = 0, fail = 0, total = paths.length;
          function finish() {
            if (fail == 0) onload(); else onerror();
          }
          paths.forEach(function(path) {
            var getRequest = files.get(path);
            getRequest.onsuccess = function getRequest_onsuccess() {
              if (FS.analyzePath(path).exists) {
                FS.unlink(path);
              }
              FS.createDataFile(PATH.dirname(path), PATH.basename(path), getRequest.result, true, true, true);
              ok++;
              if (ok + fail == total) finish();
            };
            getRequest.onerror = function getRequest_onerror() { fail++; if (ok + fail == total) finish() };
          });
          transaction.onerror = onerror;
        };
        openRequest.onerror = onerror;
      }};var PATH={splitPath:function (filename) {
        var splitPathRe = /^(\/?|)([\s\S]*?)((?:\.{1,2}|[^\/]+?|)(\.[^.\/]*|))(?:[\/]*)$/;
        return splitPathRe.exec(filename).slice(1);
      },normalizeArray:function (parts, allowAboveRoot) {
        // if the path tries to go above the root, `up` ends up > 0
        var up = 0;
        for (var i = parts.length - 1; i >= 0; i--) {
          var last = parts[i];
          if (last === '.') {
            parts.splice(i, 1);
          } else if (last === '..') {
            parts.splice(i, 1);
            up++;
          } else if (up) {
            parts.splice(i, 1);
            up--;
          }
        }
        // if the path is allowed to go above the root, restore leading ..s
        if (allowAboveRoot) {
          for (; up--; up) {
            parts.unshift('..');
          }
        }
        return parts;
      },normalize:function (path) {
        var isAbsolute = path.charAt(0) === '/',
            trailingSlash = path.substr(-1) === '/';
        // Normalize the path
        path = PATH.normalizeArray(path.split('/').filter(function(p) {
          return !!p;
        }), !isAbsolute).join('/');
        if (!path && !isAbsolute) {
          path = '.';
        }
        if (path && trailingSlash) {
          path += '/';
        }
        return (isAbsolute ? '/' : '') + path;
      },dirname:function (path) {
        var result = PATH.splitPath(path),
            root = result[0],
            dir = result[1];
        if (!root && !dir) {
          // No dirname whatsoever
          return '.';
        }
        if (dir) {
          // It has a dirname, strip trailing slash
          dir = dir.substr(0, dir.length - 1);
        }
        return root + dir;
      },basename:function (path) {
        // EMSCRIPTEN return '/'' for '/', not an empty string
        if (path === '/') return '/';
        var lastSlash = path.lastIndexOf('/');
        if (lastSlash === -1) return path;
        return path.substr(lastSlash+1);
      },extname:function (path) {
        return PATH.splitPath(path)[3];
      },join:function () {
        var paths = Array.prototype.slice.call(arguments, 0);
        return PATH.normalize(paths.join('/'));
      },join2:function (l, r) {
        return PATH.normalize(l + '/' + r);
      },resolve:function () {
        var resolvedPath = '',
          resolvedAbsolute = false;
        for (var i = arguments.length - 1; i >= -1 && !resolvedAbsolute; i--) {
          var path = (i >= 0) ? arguments[i] : FS.cwd();
          // Skip empty and invalid entries
          if (typeof path !== 'string') {
            throw new TypeError('Arguments to path.resolve must be strings');
          } else if (!path) {
            return ''; // an invalid portion invalidates the whole thing
          }
          resolvedPath = path + '/' + resolvedPath;
          resolvedAbsolute = path.charAt(0) === '/';
        }
        // At this point the path should be resolved to a full absolute path, but
        // handle relative paths to be safe (might happen when process.cwd() fails)
        resolvedPath = PATH.normalizeArray(resolvedPath.split('/').filter(function(p) {
          return !!p;
        }), !resolvedAbsolute).join('/');
        return ((resolvedAbsolute ? '/' : '') + resolvedPath) || '.';
      },relative:function (from, to) {
        from = PATH.resolve(from).substr(1);
        to = PATH.resolve(to).substr(1);
        function trim(arr) {
          var start = 0;
          for (; start < arr.length; start++) {
            if (arr[start] !== '') break;
          }
          var end = arr.length - 1;
          for (; end >= 0; end--) {
            if (arr[end] !== '') break;
          }
          if (start > end) return [];
          return arr.slice(start, end - start + 1);
        }
        var fromParts = trim(from.split('/'));
        var toParts = trim(to.split('/'));
        var length = Math.min(fromParts.length, toParts.length);
        var samePartsLength = length;
        for (var i = 0; i < length; i++) {
          if (fromParts[i] !== toParts[i]) {
            samePartsLength = i;
            break;
          }
        }
        var outputParts = [];
        for (var i = samePartsLength; i < fromParts.length; i++) {
          outputParts.push('..');
        }
        outputParts = outputParts.concat(toParts.slice(samePartsLength));
        return outputParts.join('/');
      }};
  
  
  function _emscripten_set_main_loop_timing(mode, value) {
      Browser.mainLoop.timingMode = mode;
      Browser.mainLoop.timingValue = value;
  
      if (!Browser.mainLoop.func) {
        console.error('emscripten_set_main_loop_timing: Cannot set timing mode for main loop since a main loop does not exist! Call emscripten_set_main_loop first to set one up.');
        return 1; // Return non-zero on failure, can't set timing mode when there is no main loop.
      }
  
      if (mode == 0 /*EM_TIMING_SETTIMEOUT*/) {
        Browser.mainLoop.scheduler = function Browser_mainLoop_scheduler() {
          setTimeout(Browser.mainLoop.runner, value); // doing this each time means that on exception, we stop
        };
        Browser.mainLoop.method = 'timeout';
      } else if (mode == 1 /*EM_TIMING_RAF*/) {
        Browser.mainLoop.scheduler = function Browser_mainLoop_scheduler() {
          Browser.requestAnimationFrame(Browser.mainLoop.runner);
        };
        Browser.mainLoop.method = 'rAF';
      }
      return 0;
    }function _emscripten_set_main_loop(func, fps, simulateInfiniteLoop, arg, noSetTiming) {
      Module['noExitRuntime'] = true;
  
      assert(!Browser.mainLoop.func, 'emscripten_set_main_loop: there can only be one main loop function at once: call emscripten_cancel_main_loop to cancel the previous one before setting a new one with different parameters.');
  
      Browser.mainLoop.func = func;
      Browser.mainLoop.arg = arg;
  
      var thisMainLoopId = Browser.mainLoop.currentlyRunningMainloop;
  
      Browser.mainLoop.runner = function Browser_mainLoop_runner() {
        if (ABORT) return;
        if (Browser.mainLoop.queue.length > 0) {
          var start = Date.now();
          var blocker = Browser.mainLoop.queue.shift();
          blocker.func(blocker.arg);
          if (Browser.mainLoop.remainingBlockers) {
            var remaining = Browser.mainLoop.remainingBlockers;
            var next = remaining%1 == 0 ? remaining-1 : Math.floor(remaining);
            if (blocker.counted) {
              Browser.mainLoop.remainingBlockers = next;
            } else {
              // not counted, but move the progress along a tiny bit
              next = next + 0.5; // do not steal all the next one's progress
              Browser.mainLoop.remainingBlockers = (8*remaining + next)/9;
            }
          }
          console.log('main loop blocker "' + blocker.name + '" took ' + (Date.now() - start) + ' ms'); //, left: ' + Browser.mainLoop.remainingBlockers);
          Browser.mainLoop.updateStatus();
          setTimeout(Browser.mainLoop.runner, 0);
          return;
        }
  
        // catch pauses from non-main loop sources
        if (thisMainLoopId < Browser.mainLoop.currentlyRunningMainloop) return;
  
        // Implement very basic swap interval control
        Browser.mainLoop.currentFrameNumber = Browser.mainLoop.currentFrameNumber + 1 | 0;
        if (Browser.mainLoop.timingMode == 1/*EM_TIMING_RAF*/ && Browser.mainLoop.timingValue > 1 && Browser.mainLoop.currentFrameNumber % Browser.mainLoop.timingValue != 0) {
          // Not the scheduled time to render this frame - skip.
          Browser.mainLoop.scheduler();
          return;
        }
  
        // Signal GL rendering layer that processing of a new frame is about to start. This helps it optimize
        // VBO double-buffering and reduce GPU stalls.
  
        if (Browser.mainLoop.method === 'timeout' && Module.ctx) {
          Module.printErr('Looks like you are rendering without using requestAnimationFrame for the main loop. You should use 0 for the frame rate in emscripten_set_main_loop in order to use requestAnimationFrame, as that can greatly improve your frame rates!');
          Browser.mainLoop.method = ''; // just warn once per call to set main loop
        }
  
        Browser.mainLoop.runIter(function() {
          if (typeof arg !== 'undefined') {
            Runtime.dynCall('vi', func, [arg]);
          } else {
            Runtime.dynCall('v', func);
          }
        });
  
        // catch pauses from the main loop itself
        if (thisMainLoopId < Browser.mainLoop.currentlyRunningMainloop) return;
  
        // Queue new audio data. This is important to be right after the main loop invocation, so that we will immediately be able
        // to queue the newest produced audio samples.
        // TODO: Consider adding pre- and post- rAF callbacks so that GL.newRenderingFrameStarted() and SDL.audio.queueNewAudioData()
        //       do not need to be hardcoded into this function, but can be more generic.
        if (typeof SDL === 'object' && SDL.audio && SDL.audio.queueNewAudioData) SDL.audio.queueNewAudioData();
  
        Browser.mainLoop.scheduler();
      }
  
      if (!noSetTiming) {
        if (fps && fps > 0) _emscripten_set_main_loop_timing(0/*EM_TIMING_SETTIMEOUT*/, 1000.0 / fps);
        else _emscripten_set_main_loop_timing(1/*EM_TIMING_RAF*/, 1); // Do rAF by rendering each frame (no decimating)
  
        Browser.mainLoop.scheduler();
      }
  
      if (simulateInfiniteLoop) {
        throw 'SimulateInfiniteLoop';
      }
    }var Browser={mainLoop:{scheduler:null,method:"",currentlyRunningMainloop:0,func:null,arg:0,timingMode:0,timingValue:0,currentFrameNumber:0,queue:[],pause:function () {
          Browser.mainLoop.scheduler = null;
          Browser.mainLoop.currentlyRunningMainloop++; // Incrementing this signals the previous main loop that it's now become old, and it must return.
        },resume:function () {
          Browser.mainLoop.currentlyRunningMainloop++;
          var timingMode = Browser.mainLoop.timingMode;
          var timingValue = Browser.mainLoop.timingValue;
          var func = Browser.mainLoop.func;
          Browser.mainLoop.func = null;
          _emscripten_set_main_loop(func, 0, false, Browser.mainLoop.arg, true /* do not set timing and call scheduler, we will do it on the next lines */);
          _emscripten_set_main_loop_timing(timingMode, timingValue);
          Browser.mainLoop.scheduler();
        },updateStatus:function () {
          if (Module['setStatus']) {
            var message = Module['statusMessage'] || 'Please wait...';
            var remaining = Browser.mainLoop.remainingBlockers;
            var expected = Browser.mainLoop.expectedBlockers;
            if (remaining) {
              if (remaining < expected) {
                Module['setStatus'](message + ' (' + (expected - remaining) + '/' + expected + ')');
              } else {
                Module['setStatus'](message);
              }
            } else {
              Module['setStatus']('');
            }
          }
        },runIter:function (func) {
          if (ABORT) return;
          if (Module['preMainLoop']) {
            var preRet = Module['preMainLoop']();
            if (preRet === false) {
              return; // |return false| skips a frame
            }
          }
          try {
            func();
          } catch (e) {
            if (e instanceof ExitStatus) {
              return;
            } else {
              if (e && typeof e === 'object' && e.stack) Module.printErr('exception thrown: ' + [e, e.stack]);
              throw e;
            }
          }
          if (Module['postMainLoop']) Module['postMainLoop']();
        }},isFullScreen:false,pointerLock:false,moduleContextCreatedCallbacks:[],workers:[],init:function () {
        if (!Module["preloadPlugins"]) Module["preloadPlugins"] = []; // needs to exist even in workers
  
        if (Browser.initted) return;
        Browser.initted = true;
  
        try {
          new Blob();
          Browser.hasBlobConstructor = true;
        } catch(e) {
          Browser.hasBlobConstructor = false;
          console.log("warning: no blob constructor, cannot create blobs with mimetypes");
        }
        Browser.BlobBuilder = typeof MozBlobBuilder != "undefined" ? MozBlobBuilder : (typeof WebKitBlobBuilder != "undefined" ? WebKitBlobBuilder : (!Browser.hasBlobConstructor ? console.log("warning: no BlobBuilder") : null));
        Browser.URLObject = typeof window != "undefined" ? (window.URL ? window.URL : window.webkitURL) : undefined;
        if (!Module.noImageDecoding && typeof Browser.URLObject === 'undefined') {
          console.log("warning: Browser does not support creating object URLs. Built-in browser image decoding will not be available.");
          Module.noImageDecoding = true;
        }
  
        // Support for plugins that can process preloaded files. You can add more of these to
        // your app by creating and appending to Module.preloadPlugins.
        //
        // Each plugin is asked if it can handle a file based on the file's name. If it can,
        // it is given the file's raw data. When it is done, it calls a callback with the file's
        // (possibly modified) data. For example, a plugin might decompress a file, or it
        // might create some side data structure for use later (like an Image element, etc.).
  
        var imagePlugin = {};
        imagePlugin['canHandle'] = function imagePlugin_canHandle(name) {
          return !Module.noImageDecoding && /\.(jpg|jpeg|png|bmp)$/i.test(name);
        };
        imagePlugin['handle'] = function imagePlugin_handle(byteArray, name, onload, onerror) {
          var b = null;
          if (Browser.hasBlobConstructor) {
            try {
              b = new Blob([byteArray], { type: Browser.getMimetype(name) });
              if (b.size !== byteArray.length) { // Safari bug #118630
                // Safari's Blob can only take an ArrayBuffer
                b = new Blob([(new Uint8Array(byteArray)).buffer], { type: Browser.getMimetype(name) });
              }
            } catch(e) {
              Runtime.warnOnce('Blob constructor present but fails: ' + e + '; falling back to blob builder');
            }
          }
          if (!b) {
            var bb = new Browser.BlobBuilder();
            bb.append((new Uint8Array(byteArray)).buffer); // we need to pass a buffer, and must copy the array to get the right data range
            b = bb.getBlob();
          }
          var url = Browser.URLObject.createObjectURL(b);
          assert(typeof url == 'string', 'createObjectURL must return a url as a string');
          var img = new Image();
          img.onload = function img_onload() {
            assert(img.complete, 'Image ' + name + ' could not be decoded');
            var canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            var ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);
            Module["preloadedImages"][name] = canvas;
            Browser.URLObject.revokeObjectURL(url);
            if (onload) onload(byteArray);
          };
          img.onerror = function img_onerror(event) {
            console.log('Image ' + url + ' could not be decoded');
            if (onerror) onerror();
          };
          img.src = url;
        };
        Module['preloadPlugins'].push(imagePlugin);
  
        var audioPlugin = {};
        audioPlugin['canHandle'] = function audioPlugin_canHandle(name) {
          return !Module.noAudioDecoding && name.substr(-4) in { '.ogg': 1, '.wav': 1, '.mp3': 1 };
        };
        audioPlugin['handle'] = function audioPlugin_handle(byteArray, name, onload, onerror) {
          var done = false;
          function finish(audio) {
            if (done) return;
            done = true;
            Module["preloadedAudios"][name] = audio;
            if (onload) onload(byteArray);
          }
          function fail() {
            if (done) return;
            done = true;
            Module["preloadedAudios"][name] = new Audio(); // empty shim
            if (onerror) onerror();
          }
          if (Browser.hasBlobConstructor) {
            try {
              var b = new Blob([byteArray], { type: Browser.getMimetype(name) });
            } catch(e) {
              return fail();
            }
            var url = Browser.URLObject.createObjectURL(b); // XXX we never revoke this!
            assert(typeof url == 'string', 'createObjectURL must return a url as a string');
            var audio = new Audio();
            audio.addEventListener('canplaythrough', function() { finish(audio) }, false); // use addEventListener due to chromium bug 124926
            audio.onerror = function audio_onerror(event) {
              if (done) return;
              console.log('warning: browser could not fully decode audio ' + name + ', trying slower base64 approach');
              function encode64(data) {
                var BASE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
                var PAD = '=';
                var ret = '';
                var leftchar = 0;
                var leftbits = 0;
                for (var i = 0; i < data.length; i++) {
                  leftchar = (leftchar << 8) | data[i];
                  leftbits += 8;
                  while (leftbits >= 6) {
                    var curr = (leftchar >> (leftbits-6)) & 0x3f;
                    leftbits -= 6;
                    ret += BASE[curr];
                  }
                }
                if (leftbits == 2) {
                  ret += BASE[(leftchar&3) << 4];
                  ret += PAD + PAD;
                } else if (leftbits == 4) {
                  ret += BASE[(leftchar&0xf) << 2];
                  ret += PAD;
                }
                return ret;
              }
              audio.src = 'data:audio/x-' + name.substr(-3) + ';base64,' + encode64(byteArray);
              finish(audio); // we don't wait for confirmation this worked - but it's worth trying
            };
            audio.src = url;
            // workaround for chrome bug 124926 - we do not always get oncanplaythrough or onerror
            Browser.safeSetTimeout(function() {
              finish(audio); // try to use it even though it is not necessarily ready to play
            }, 10000);
          } else {
            return fail();
          }
        };
        Module['preloadPlugins'].push(audioPlugin);
  
        // Canvas event setup
  
        var canvas = Module['canvas'];
        function pointerLockChange() {
          Browser.pointerLock = document['pointerLockElement'] === canvas ||
                                document['mozPointerLockElement'] === canvas ||
                                document['webkitPointerLockElement'] === canvas ||
                                document['msPointerLockElement'] === canvas;
        }
        if (canvas) {
          // forced aspect ratio can be enabled by defining 'forcedAspectRatio' on Module
          // Module['forcedAspectRatio'] = 4 / 3;
          
          canvas.requestPointerLock = canvas['requestPointerLock'] ||
                                      canvas['mozRequestPointerLock'] ||
                                      canvas['webkitRequestPointerLock'] ||
                                      canvas['msRequestPointerLock'] ||
                                      function(){};
          canvas.exitPointerLock = document['exitPointerLock'] ||
                                   document['mozExitPointerLock'] ||
                                   document['webkitExitPointerLock'] ||
                                   document['msExitPointerLock'] ||
                                   function(){}; // no-op if function does not exist
          canvas.exitPointerLock = canvas.exitPointerLock.bind(document);
  
  
          document.addEventListener('pointerlockchange', pointerLockChange, false);
          document.addEventListener('mozpointerlockchange', pointerLockChange, false);
          document.addEventListener('webkitpointerlockchange', pointerLockChange, false);
          document.addEventListener('mspointerlockchange', pointerLockChange, false);
  
          if (Module['elementPointerLock']) {
            canvas.addEventListener("click", function(ev) {
              if (!Browser.pointerLock && canvas.requestPointerLock) {
                canvas.requestPointerLock();
                ev.preventDefault();
              }
            }, false);
          }
        }
      },createContext:function (canvas, useWebGL, setInModule, webGLContextAttributes) {
        if (useWebGL && Module.ctx && canvas == Module.canvas) return Module.ctx; // no need to recreate GL context if it's already been created for this canvas.
  
        var ctx;
        var contextHandle;
        if (useWebGL) {
          // For GLES2/desktop GL compatibility, adjust a few defaults to be different to WebGL defaults, so that they align better with the desktop defaults.
          var contextAttributes = {
            antialias: false,
            alpha: false
          };
  
          if (webGLContextAttributes) {
            for (var attribute in webGLContextAttributes) {
              contextAttributes[attribute] = webGLContextAttributes[attribute];
            }
          }
  
          contextHandle = GL.createContext(canvas, contextAttributes);
          if (contextHandle) {
            ctx = GL.getContext(contextHandle).GLctx;
          }
          // Set the background of the WebGL canvas to black
          canvas.style.backgroundColor = "black";
        } else {
          ctx = canvas.getContext('2d');
        }
  
        if (!ctx) return null;
  
        if (setInModule) {
          if (!useWebGL) assert(typeof GLctx === 'undefined', 'cannot set in module if GLctx is used, but we are a non-GL context that would replace it');
  
          Module.ctx = ctx;
          if (useWebGL) GL.makeContextCurrent(contextHandle);
          Module.useWebGL = useWebGL;
          Browser.moduleContextCreatedCallbacks.forEach(function(callback) { callback() });
          Browser.init();
        }
        return ctx;
      },destroyContext:function (canvas, useWebGL, setInModule) {},fullScreenHandlersInstalled:false,lockPointer:undefined,resizeCanvas:undefined,requestFullScreen:function (lockPointer, resizeCanvas, vrDevice) {
        Browser.lockPointer = lockPointer;
        Browser.resizeCanvas = resizeCanvas;
        Browser.vrDevice = vrDevice;
        if (typeof Browser.lockPointer === 'undefined') Browser.lockPointer = true;
        if (typeof Browser.resizeCanvas === 'undefined') Browser.resizeCanvas = false;
        if (typeof Browser.vrDevice === 'undefined') Browser.vrDevice = null;
  
        var canvas = Module['canvas'];
        function fullScreenChange() {
          Browser.isFullScreen = false;
          var canvasContainer = canvas.parentNode;
          if ((document['webkitFullScreenElement'] || document['webkitFullscreenElement'] ||
               document['mozFullScreenElement'] || document['mozFullscreenElement'] ||
               document['fullScreenElement'] || document['fullscreenElement'] ||
               document['msFullScreenElement'] || document['msFullscreenElement'] ||
               document['webkitCurrentFullScreenElement']) === canvasContainer) {
            canvas.cancelFullScreen = document['cancelFullScreen'] ||
                                      document['mozCancelFullScreen'] ||
                                      document['webkitCancelFullScreen'] ||
                                      document['msExitFullscreen'] ||
                                      document['exitFullscreen'] ||
                                      function() {};
            canvas.cancelFullScreen = canvas.cancelFullScreen.bind(document);
            if (Browser.lockPointer) canvas.requestPointerLock();
            Browser.isFullScreen = true;
            if (Browser.resizeCanvas) Browser.setFullScreenCanvasSize();
          } else {
            
            // remove the full screen specific parent of the canvas again to restore the HTML structure from before going full screen
            canvasContainer.parentNode.insertBefore(canvas, canvasContainer);
            canvasContainer.parentNode.removeChild(canvasContainer);
            
            if (Browser.resizeCanvas) Browser.setWindowedCanvasSize();
          }
          if (Module['onFullScreen']) Module['onFullScreen'](Browser.isFullScreen);
          Browser.updateCanvasDimensions(canvas);
        }
  
        if (!Browser.fullScreenHandlersInstalled) {
          Browser.fullScreenHandlersInstalled = true;
          document.addEventListener('fullscreenchange', fullScreenChange, false);
          document.addEventListener('mozfullscreenchange', fullScreenChange, false);
          document.addEventListener('webkitfullscreenchange', fullScreenChange, false);
          document.addEventListener('MSFullscreenChange', fullScreenChange, false);
        }
  
        // create a new parent to ensure the canvas has no siblings. this allows browsers to optimize full screen performance when its parent is the full screen root
        var canvasContainer = document.createElement("div");
        canvas.parentNode.insertBefore(canvasContainer, canvas);
        canvasContainer.appendChild(canvas);
  
        // use parent of canvas as full screen root to allow aspect ratio correction (Firefox stretches the root to screen size)
        canvasContainer.requestFullScreen = canvasContainer['requestFullScreen'] ||
                                            canvasContainer['mozRequestFullScreen'] ||
                                            canvasContainer['msRequestFullscreen'] ||
                                           (canvasContainer['webkitRequestFullScreen'] ? function() { canvasContainer['webkitRequestFullScreen'](Element['ALLOW_KEYBOARD_INPUT']) } : null);
  
        if (vrDevice) {
          canvasContainer.requestFullScreen({ vrDisplay: vrDevice });
        } else {
          canvasContainer.requestFullScreen();
        }
      },nextRAF:0,fakeRequestAnimationFrame:function (func) {
        // try to keep 60fps between calls to here
        var now = Date.now();
        if (Browser.nextRAF === 0) {
          Browser.nextRAF = now + 1000/60;
        } else {
          while (now + 2 >= Browser.nextRAF) { // fudge a little, to avoid timer jitter causing us to do lots of delay:0
            Browser.nextRAF += 1000/60;
          }
        }
        var delay = Math.max(Browser.nextRAF - now, 0);
        setTimeout(func, delay);
      },requestAnimationFrame:function requestAnimationFrame(func) {
        if (typeof window === 'undefined') { // Provide fallback to setTimeout if window is undefined (e.g. in Node.js)
          Browser.fakeRequestAnimationFrame(func);
        } else {
          if (!window.requestAnimationFrame) {
            window.requestAnimationFrame = window['requestAnimationFrame'] ||
                                           window['mozRequestAnimationFrame'] ||
                                           window['webkitRequestAnimationFrame'] ||
                                           window['msRequestAnimationFrame'] ||
                                           window['oRequestAnimationFrame'] ||
                                           Browser.fakeRequestAnimationFrame;
          }
          window.requestAnimationFrame(func);
        }
      },safeCallback:function (func) {
        return function() {
          if (!ABORT) return func.apply(null, arguments);
        };
      },allowAsyncCallbacks:true,queuedAsyncCallbacks:[],pauseAsyncCallbacks:function () {
        Browser.allowAsyncCallbacks = false;
      },resumeAsyncCallbacks:function () { // marks future callbacks as ok to execute, and synchronously runs any remaining ones right now
        Browser.allowAsyncCallbacks = true;
        if (Browser.queuedAsyncCallbacks.length > 0) {
          var callbacks = Browser.queuedAsyncCallbacks;
          Browser.queuedAsyncCallbacks = [];
          callbacks.forEach(function(func) {
            func();
          });
        }
      },safeRequestAnimationFrame:function (func) {
        return Browser.requestAnimationFrame(function() {
          if (ABORT) return;
          if (Browser.allowAsyncCallbacks) {
            func();
          } else {
            Browser.queuedAsyncCallbacks.push(func);
          }
        });
      },safeSetTimeout:function (func, timeout) {
        Module['noExitRuntime'] = true;
        return setTimeout(function() {
          if (ABORT) return;
          if (Browser.allowAsyncCallbacks) {
            func();
          } else {
            Browser.queuedAsyncCallbacks.push(func);
          }
        }, timeout);
      },safeSetInterval:function (func, timeout) {
        Module['noExitRuntime'] = true;
        return setInterval(function() {
          if (ABORT) return;
          if (Browser.allowAsyncCallbacks) {
            func();
          } // drop it on the floor otherwise, next interval will kick in
        }, timeout);
      },getMimetype:function (name) {
        return {
          'jpg': 'image/jpeg',
          'jpeg': 'image/jpeg',
          'png': 'image/png',
          'bmp': 'image/bmp',
          'ogg': 'audio/ogg',
          'wav': 'audio/wav',
          'mp3': 'audio/mpeg'
        }[name.substr(name.lastIndexOf('.')+1)];
      },getUserMedia:function (func) {
        if(!window.getUserMedia) {
          window.getUserMedia = navigator['getUserMedia'] ||
                                navigator['mozGetUserMedia'];
        }
        window.getUserMedia(func);
      },getMovementX:function (event) {
        return event['movementX'] ||
               event['mozMovementX'] ||
               event['webkitMovementX'] ||
               0;
      },getMovementY:function (event) {
        return event['movementY'] ||
               event['mozMovementY'] ||
               event['webkitMovementY'] ||
               0;
      },getMouseWheelDelta:function (event) {
        var delta = 0;
        switch (event.type) {
          case 'DOMMouseScroll': 
            delta = event.detail;
            break;
          case 'mousewheel': 
            delta = event.wheelDelta;
            break;
          case 'wheel': 
            delta = event['deltaY'];
            break;
          default:
            throw 'unrecognized mouse wheel event: ' + event.type;
        }
        return delta;
      },mouseX:0,mouseY:0,mouseMovementX:0,mouseMovementY:0,touches:{},lastTouches:{},calculateMouseEvent:function (event) { // event should be mousemove, mousedown or mouseup
        if (Browser.pointerLock) {
          // When the pointer is locked, calculate the coordinates
          // based on the movement of the mouse.
          // Workaround for Firefox bug 764498
          if (event.type != 'mousemove' &&
              ('mozMovementX' in event)) {
            Browser.mouseMovementX = Browser.mouseMovementY = 0;
          } else {
            Browser.mouseMovementX = Browser.getMovementX(event);
            Browser.mouseMovementY = Browser.getMovementY(event);
          }
          
          // check if SDL is available
          if (typeof SDL != "undefined") {
          	Browser.mouseX = SDL.mouseX + Browser.mouseMovementX;
          	Browser.mouseY = SDL.mouseY + Browser.mouseMovementY;
          } else {
          	// just add the mouse delta to the current absolut mouse position
          	// FIXME: ideally this should be clamped against the canvas size and zero
          	Browser.mouseX += Browser.mouseMovementX;
          	Browser.mouseY += Browser.mouseMovementY;
          }        
        } else {
          // Otherwise, calculate the movement based on the changes
          // in the coordinates.
          var rect = Module["canvas"].getBoundingClientRect();
          var cw = Module["canvas"].width;
          var ch = Module["canvas"].height;
  
          // Neither .scrollX or .pageXOffset are defined in a spec, but
          // we prefer .scrollX because it is currently in a spec draft.
          // (see: http://www.w3.org/TR/2013/WD-cssom-view-20131217/)
          var scrollX = ((typeof window.scrollX !== 'undefined') ? window.scrollX : window.pageXOffset);
          var scrollY = ((typeof window.scrollY !== 'undefined') ? window.scrollY : window.pageYOffset);
          // If this assert lands, it's likely because the browser doesn't support scrollX or pageXOffset
          // and we have no viable fallback.
          assert((typeof scrollX !== 'undefined') && (typeof scrollY !== 'undefined'), 'Unable to retrieve scroll position, mouse positions likely broken.');
  
          if (event.type === 'touchstart' || event.type === 'touchend' || event.type === 'touchmove') {
            var touch = event.touch;
            if (touch === undefined) {
              return; // the "touch" property is only defined in SDL
  
            }
            var adjustedX = touch.pageX - (scrollX + rect.left);
            var adjustedY = touch.pageY - (scrollY + rect.top);
  
            adjustedX = adjustedX * (cw / rect.width);
            adjustedY = adjustedY * (ch / rect.height);
  
            var coords = { x: adjustedX, y: adjustedY };
            
            if (event.type === 'touchstart') {
              Browser.lastTouches[touch.identifier] = coords;
              Browser.touches[touch.identifier] = coords;
            } else if (event.type === 'touchend' || event.type === 'touchmove') {
              Browser.lastTouches[touch.identifier] = Browser.touches[touch.identifier];
              Browser.touches[touch.identifier] = { x: adjustedX, y: adjustedY };
            } 
            return;
          }
  
          var x = event.pageX - (scrollX + rect.left);
          var y = event.pageY - (scrollY + rect.top);
  
          // the canvas might be CSS-scaled compared to its backbuffer;
          // SDL-using content will want mouse coordinates in terms
          // of backbuffer units.
          x = x * (cw / rect.width);
          y = y * (ch / rect.height);
  
          Browser.mouseMovementX = x - Browser.mouseX;
          Browser.mouseMovementY = y - Browser.mouseY;
          Browser.mouseX = x;
          Browser.mouseY = y;
        }
      },xhrLoad:function (url, onload, onerror) {
        var xhr = new XMLHttpRequest();
        xhr.open('GET', url, true);
        xhr.responseType = 'arraybuffer';
        xhr.onload = function xhr_onload() {
          if (xhr.status == 200 || (xhr.status == 0 && xhr.response)) { // file URLs can return 0
            onload(xhr.response);
          } else {
            onerror();
          }
        };
        xhr.onerror = onerror;
        xhr.send(null);
      },asyncLoad:function (url, onload, onerror, noRunDep) {
        Browser.xhrLoad(url, function(arrayBuffer) {
          assert(arrayBuffer, 'Loading data file "' + url + '" failed (no arrayBuffer).');
          onload(new Uint8Array(arrayBuffer));
          if (!noRunDep) removeRunDependency('al ' + url);
        }, function(event) {
          if (onerror) {
            onerror();
          } else {
            throw 'Loading data file "' + url + '" failed.';
          }
        });
        if (!noRunDep) addRunDependency('al ' + url);
      },resizeListeners:[],updateResizeListeners:function () {
        var canvas = Module['canvas'];
        Browser.resizeListeners.forEach(function(listener) {
          listener(canvas.width, canvas.height);
        });
      },setCanvasSize:function (width, height, noUpdates) {
        var canvas = Module['canvas'];
        Browser.updateCanvasDimensions(canvas, width, height);
        if (!noUpdates) Browser.updateResizeListeners();
      },windowedWidth:0,windowedHeight:0,setFullScreenCanvasSize:function () {
        // check if SDL is available   
        if (typeof SDL != "undefined") {
        	var flags = HEAPU32[((SDL.screen+Runtime.QUANTUM_SIZE*0)>>2)];
        	flags = flags | 0x00800000; // set SDL_FULLSCREEN flag
        	HEAP32[((SDL.screen+Runtime.QUANTUM_SIZE*0)>>2)]=flags
        }
        Browser.updateResizeListeners();
      },setWindowedCanvasSize:function () {
        // check if SDL is available       
        if (typeof SDL != "undefined") {
        	var flags = HEAPU32[((SDL.screen+Runtime.QUANTUM_SIZE*0)>>2)];
        	flags = flags & ~0x00800000; // clear SDL_FULLSCREEN flag
        	HEAP32[((SDL.screen+Runtime.QUANTUM_SIZE*0)>>2)]=flags
        }
        Browser.updateResizeListeners();
      },updateCanvasDimensions:function (canvas, wNative, hNative) {
        if (wNative && hNative) {
          canvas.widthNative = wNative;
          canvas.heightNative = hNative;
        } else {
          wNative = canvas.widthNative;
          hNative = canvas.heightNative;
        }
        var w = wNative;
        var h = hNative;
        if (Module['forcedAspectRatio'] && Module['forcedAspectRatio'] > 0) {
          if (w/h < Module['forcedAspectRatio']) {
            w = Math.round(h * Module['forcedAspectRatio']);
          } else {
            h = Math.round(w / Module['forcedAspectRatio']);
          }
        }
        if (((document['webkitFullScreenElement'] || document['webkitFullscreenElement'] ||
             document['mozFullScreenElement'] || document['mozFullscreenElement'] ||
             document['fullScreenElement'] || document['fullscreenElement'] ||
             document['msFullScreenElement'] || document['msFullscreenElement'] ||
             document['webkitCurrentFullScreenElement']) === canvas.parentNode) && (typeof screen != 'undefined')) {
           var factor = Math.min(screen.width / w, screen.height / h);
           w = Math.round(w * factor);
           h = Math.round(h * factor);
        }
        if (Browser.resizeCanvas) {
          if (canvas.width  != w) canvas.width  = w;
          if (canvas.height != h) canvas.height = h;
          if (typeof canvas.style != 'undefined') {
            canvas.style.removeProperty( "width");
            canvas.style.removeProperty("height");
          }
        } else {
          if (canvas.width  != wNative) canvas.width  = wNative;
          if (canvas.height != hNative) canvas.height = hNative;
          if (typeof canvas.style != 'undefined') {
            if (w != wNative || h != hNative) {
              canvas.style.setProperty( "width", w + "px", "important");
              canvas.style.setProperty("height", h + "px", "important");
            } else {
              canvas.style.removeProperty( "width");
              canvas.style.removeProperty("height");
            }
          }
        }
      },wgetRequests:{},nextWgetRequestHandle:0,getNextWgetRequestHandle:function () {
        var handle = Browser.nextWgetRequestHandle;
        Browser.nextWgetRequestHandle++;
        return handle;
      }};

  function _time(ptr) {
      var ret = (Date.now()/1000)|0;
      if (ptr) {
        HEAP32[((ptr)>>2)]=ret;
      }
      return ret;
    }

  var _atan2f=Math_atan2;
___errno_state = Runtime.staticAlloc(4); HEAP32[((___errno_state)>>2)]=0;
Module["requestFullScreen"] = function Module_requestFullScreen(lockPointer, resizeCanvas, vrDevice) { Browser.requestFullScreen(lockPointer, resizeCanvas, vrDevice) };
  Module["requestAnimationFrame"] = function Module_requestAnimationFrame(func) { Browser.requestAnimationFrame(func) };
  Module["setCanvasSize"] = function Module_setCanvasSize(width, height, noUpdates) { Browser.setCanvasSize(width, height, noUpdates) };
  Module["pauseMainLoop"] = function Module_pauseMainLoop() { Browser.mainLoop.pause() };
  Module["resumeMainLoop"] = function Module_resumeMainLoop() { Browser.mainLoop.resume() };
  Module["getUserMedia"] = function Module_getUserMedia() { Browser.getUserMedia() }
FS.staticInit();__ATINIT__.unshift({ func: function() { if (!Module["noFSInit"] && !FS.init.initialized) FS.init() } });__ATMAIN__.push({ func: function() { FS.ignorePermissions = false } });__ATEXIT__.push({ func: function() { FS.quit() } });Module["FS_createFolder"] = FS.createFolder;Module["FS_createPath"] = FS.createPath;Module["FS_createDataFile"] = FS.createDataFile;Module["FS_createPreloadedFile"] = FS.createPreloadedFile;Module["FS_createLazyFile"] = FS.createLazyFile;Module["FS_createLink"] = FS.createLink;Module["FS_createDevice"] = FS.createDevice;
__ATINIT__.unshift({ func: function() { TTY.init() } });__ATEXIT__.push({ func: function() { TTY.shutdown() } });
if (ENVIRONMENT_IS_NODE) { var fs = require("fs"); NODEFS.staticInit(); }
STACK_BASE = STACKTOP = Runtime.alignMemory(STATICTOP);

staticSealed = true; // seal the static portion of memory

STACK_MAX = STACK_BASE + TOTAL_STACK;

DYNAMIC_BASE = DYNAMICTOP = Runtime.alignMemory(STACK_MAX);

assert(DYNAMIC_BASE < TOTAL_MEMORY, "TOTAL_MEMORY not big enough for stack");



function nullFunc_viiiii(x) { Module["printErr"]("Invalid function pointer called with signature 'viiiii'. Perhaps this is an invalid value (e.g. caused by calling a virtual method on a NULL pointer)? Or calling a function with an incorrect type, which will fail? (it is worth building your source files with -Werror (warnings are errors), as warnings can indicate undefined behavior which can cause this)");  Module["printErr"]("Build with ASSERTIONS=2 for more info."); abort(x) }

function nullFunc_vi(x) { Module["printErr"]("Invalid function pointer called with signature 'vi'. Perhaps this is an invalid value (e.g. caused by calling a virtual method on a NULL pointer)? Or calling a function with an incorrect type, which will fail? (it is worth building your source files with -Werror (warnings are errors), as warnings can indicate undefined behavior which can cause this)");  Module["printErr"]("Build with ASSERTIONS=2 for more info."); abort(x) }

function nullFunc_vii(x) { Module["printErr"]("Invalid function pointer called with signature 'vii'. Perhaps this is an invalid value (e.g. caused by calling a virtual method on a NULL pointer)? Or calling a function with an incorrect type, which will fail? (it is worth building your source files with -Werror (warnings are errors), as warnings can indicate undefined behavior which can cause this)");  Module["printErr"]("Build with ASSERTIONS=2 for more info."); abort(x) }

function nullFunc_iiii(x) { Module["printErr"]("Invalid function pointer called with signature 'iiii'. Perhaps this is an invalid value (e.g. caused by calling a virtual method on a NULL pointer)? Or calling a function with an incorrect type, which will fail? (it is worth building your source files with -Werror (warnings are errors), as warnings can indicate undefined behavior which can cause this)");  Module["printErr"]("Build with ASSERTIONS=2 for more info."); abort(x) }

function nullFunc_v(x) { Module["printErr"]("Invalid function pointer called with signature 'v'. Perhaps this is an invalid value (e.g. caused by calling a virtual method on a NULL pointer)? Or calling a function with an incorrect type, which will fail? (it is worth building your source files with -Werror (warnings are errors), as warnings can indicate undefined behavior which can cause this)");  Module["printErr"]("Build with ASSERTIONS=2 for more info."); abort(x) }

function nullFunc_viiiiii(x) { Module["printErr"]("Invalid function pointer called with signature 'viiiiii'. Perhaps this is an invalid value (e.g. caused by calling a virtual method on a NULL pointer)? Or calling a function with an incorrect type, which will fail? (it is worth building your source files with -Werror (warnings are errors), as warnings can indicate undefined behavior which can cause this)");  Module["printErr"]("Build with ASSERTIONS=2 for more info."); abort(x) }

function nullFunc_viiii(x) { Module["printErr"]("Invalid function pointer called with signature 'viiii'. Perhaps this is an invalid value (e.g. caused by calling a virtual method on a NULL pointer)? Or calling a function with an incorrect type, which will fail? (it is worth building your source files with -Werror (warnings are errors), as warnings can indicate undefined behavior which can cause this)");  Module["printErr"]("Build with ASSERTIONS=2 for more info."); abort(x) }

function invoke_viiiii(index,a1,a2,a3,a4,a5) {
  try {
    Module["dynCall_viiiii"](index,a1,a2,a3,a4,a5);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}

function invoke_vi(index,a1) {
  try {
    Module["dynCall_vi"](index,a1);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}

function invoke_vii(index,a1,a2) {
  try {
    Module["dynCall_vii"](index,a1,a2);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}

function invoke_iiii(index,a1,a2,a3) {
  try {
    return Module["dynCall_iiii"](index,a1,a2,a3);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}

function invoke_v(index) {
  try {
    Module["dynCall_v"](index);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}

function invoke_viiiiii(index,a1,a2,a3,a4,a5,a6) {
  try {
    Module["dynCall_viiiiii"](index,a1,a2,a3,a4,a5,a6);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}

function invoke_viiii(index,a1,a2,a3,a4) {
  try {
    Module["dynCall_viiii"](index,a1,a2,a3,a4);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}

Module.asmGlobalArg = { "Math": Math, "Int8Array": Int8Array, "Int16Array": Int16Array, "Int32Array": Int32Array, "Uint8Array": Uint8Array, "Uint16Array": Uint16Array, "Uint32Array": Uint32Array, "Float32Array": Float32Array, "Float64Array": Float64Array, "NaN": NaN, "Infinity": Infinity };
Module.asmLibraryArg = { "abort": abort, "assert": assert, "nullFunc_viiiii": nullFunc_viiiii, "nullFunc_vi": nullFunc_vi, "nullFunc_vii": nullFunc_vii, "nullFunc_iiii": nullFunc_iiii, "nullFunc_v": nullFunc_v, "nullFunc_viiiiii": nullFunc_viiiiii, "nullFunc_viiii": nullFunc_viiii, "invoke_viiiii": invoke_viiiii, "invoke_vi": invoke_vi, "invoke_vii": invoke_vii, "invoke_iiii": invoke_iiii, "invoke_v": invoke_v, "invoke_viiiiii": invoke_viiiiii, "invoke_viiii": invoke_viiii, "_sbrk": _sbrk, "_fflush": _fflush, "_sinf": _sinf, "_cosf": _cosf, "___errno_location": ___errno_location, "_emscripten_set_main_loop": _emscripten_set_main_loop, "_abort": _abort, "___setErrNo": ___setErrNo, "_fabsf": _fabsf, "_ceilf": _ceilf, "_time": _time, "_llvm_pow_f32": _llvm_pow_f32, "_floorf": _floorf, "_emscripten_set_main_loop_timing": _emscripten_set_main_loop_timing, "_emscripten_memcpy_big": _emscripten_memcpy_big, "_sqrtf": _sqrtf, "_sqrt": _sqrt, "_sysconf": _sysconf, "___cxa_pure_virtual": ___cxa_pure_virtual, "_atan2f": _atan2f, "STACKTOP": STACKTOP, "STACK_MAX": STACK_MAX, "tempDoublePtr": tempDoublePtr, "ABORT": ABORT };
// EMSCRIPTEN_START_ASM
var asm = (function(global, env, buffer) {
  'almost asm';
  
  var HEAP8 = new global.Int8Array(buffer);
  var HEAP16 = new global.Int16Array(buffer);
  var HEAP32 = new global.Int32Array(buffer);
  var HEAPU8 = new global.Uint8Array(buffer);
  var HEAPU16 = new global.Uint16Array(buffer);
  var HEAPU32 = new global.Uint32Array(buffer);
  var HEAPF32 = new global.Float32Array(buffer);
  var HEAPF64 = new global.Float64Array(buffer);


  var STACKTOP=env.STACKTOP|0;
  var STACK_MAX=env.STACK_MAX|0;
  var tempDoublePtr=env.tempDoublePtr|0;
  var ABORT=env.ABORT|0;

  var __THREW__ = 0;
  var threwValue = 0;
  var setjmpId = 0;
  var undef = 0;
  var nan = global.NaN, inf = global.Infinity;
  var tempInt = 0, tempBigInt = 0, tempBigIntP = 0, tempBigIntS = 0, tempBigIntR = 0.0, tempBigIntI = 0, tempBigIntD = 0, tempValue = 0, tempDouble = 0.0;

  var tempRet0 = 0;
  var tempRet1 = 0;
  var tempRet2 = 0;
  var tempRet3 = 0;
  var tempRet4 = 0;
  var tempRet5 = 0;
  var tempRet6 = 0;
  var tempRet7 = 0;
  var tempRet8 = 0;
  var tempRet9 = 0;
  var Math_floor=global.Math.floor;
  var Math_abs=global.Math.abs;
  var Math_sqrt=global.Math.sqrt;
  var Math_pow=global.Math.pow;
  var Math_cos=global.Math.cos;
  var Math_sin=global.Math.sin;
  var Math_tan=global.Math.tan;
  var Math_acos=global.Math.acos;
  var Math_asin=global.Math.asin;
  var Math_atan=global.Math.atan;
  var Math_atan2=global.Math.atan2;
  var Math_exp=global.Math.exp;
  var Math_log=global.Math.log;
  var Math_ceil=global.Math.ceil;
  var Math_imul=global.Math.imul;
  var Math_min=global.Math.min;
  var Math_clz32=global.Math.clz32;
  var abort=env.abort;
  var assert=env.assert;
  var nullFunc_viiiii=env.nullFunc_viiiii;
  var nullFunc_vi=env.nullFunc_vi;
  var nullFunc_vii=env.nullFunc_vii;
  var nullFunc_iiii=env.nullFunc_iiii;
  var nullFunc_v=env.nullFunc_v;
  var nullFunc_viiiiii=env.nullFunc_viiiiii;
  var nullFunc_viiii=env.nullFunc_viiii;
  var invoke_viiiii=env.invoke_viiiii;
  var invoke_vi=env.invoke_vi;
  var invoke_vii=env.invoke_vii;
  var invoke_iiii=env.invoke_iiii;
  var invoke_v=env.invoke_v;
  var invoke_viiiiii=env.invoke_viiiiii;
  var invoke_viiii=env.invoke_viiii;
  var _sbrk=env._sbrk;
  var _fflush=env._fflush;
  var _sinf=env._sinf;
  var _cosf=env._cosf;
  var ___errno_location=env.___errno_location;
  var _emscripten_set_main_loop=env._emscripten_set_main_loop;
  var _abort=env._abort;
  var ___setErrNo=env.___setErrNo;
  var _fabsf=env._fabsf;
  var _ceilf=env._ceilf;
  var _time=env._time;
  var _llvm_pow_f32=env._llvm_pow_f32;
  var _floorf=env._floorf;
  var _emscripten_set_main_loop_timing=env._emscripten_set_main_loop_timing;
  var _emscripten_memcpy_big=env._emscripten_memcpy_big;
  var _sqrtf=env._sqrtf;
  var _sqrt=env._sqrt;
  var _sysconf=env._sysconf;
  var ___cxa_pure_virtual=env.___cxa_pure_virtual;
  var _atan2f=env._atan2f;
  var tempFloat = 0.0;

// EMSCRIPTEN_START_FUNCS
function stackAlloc(size) {
  size = size|0;
  var ret = 0;
  ret = STACKTOP;
  STACKTOP = (STACKTOP + size)|0;
STACKTOP = (STACKTOP + 15)&-16;
if ((STACKTOP|0) >= (STACK_MAX|0)) abort();

  return ret|0;
}
function stackSave() {
  return STACKTOP|0;
}
function stackRestore(top) {
  top = top|0;
  STACKTOP = top;
}

function setThrew(threw, value) {
  threw = threw|0;
  value = value|0;
  if ((__THREW__|0) == 0) {
    __THREW__ = threw;
    threwValue = value;
  }
}
function copyTempFloat(ptr) {
  ptr = ptr|0;
  HEAP8[tempDoublePtr>>0] = HEAP8[ptr>>0];
  HEAP8[tempDoublePtr+1>>0] = HEAP8[ptr+1>>0];
  HEAP8[tempDoublePtr+2>>0] = HEAP8[ptr+2>>0];
  HEAP8[tempDoublePtr+3>>0] = HEAP8[ptr+3>>0];
}
function copyTempDouble(ptr) {
  ptr = ptr|0;
  HEAP8[tempDoublePtr>>0] = HEAP8[ptr>>0];
  HEAP8[tempDoublePtr+1>>0] = HEAP8[ptr+1>>0];
  HEAP8[tempDoublePtr+2>>0] = HEAP8[ptr+2>>0];
  HEAP8[tempDoublePtr+3>>0] = HEAP8[ptr+3>>0];
  HEAP8[tempDoublePtr+4>>0] = HEAP8[ptr+4>>0];
  HEAP8[tempDoublePtr+5>>0] = HEAP8[ptr+5>>0];
  HEAP8[tempDoublePtr+6>>0] = HEAP8[ptr+6>>0];
  HEAP8[tempDoublePtr+7>>0] = HEAP8[ptr+7>>0];
}
function setTempRet0(value) {
  value = value|0;
  tempRet0 = value;
}
function getTempRet0() {
  return tempRet0|0;
}

function __ZN6squish17CompressAlphaDxt3EPKhiPv($rgba,$mask,$block) {
 $rgba = $rgba|0;
 $mask = $mask|0;
 $block = $block|0;
 var $0 = 0, $1 = 0, $10 = 0, $11 = 0, $12 = 0.0, $13 = 0.0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $2 = 0, $20 = 0.0, $21 = 0.0, $22 = 0.0, $23 = 0, $24 = 0.0, $25 = 0, $26 = 0;
 var $27 = 0, $28 = 0, $29 = 0, $3 = 0, $30 = 0, $31 = 0, $32 = 0, $33 = 0, $34 = 0, $35 = 0, $36 = 0, $37 = 0, $38 = 0, $39 = 0, $4 = 0, $40 = 0, $41 = 0, $42 = 0, $43 = 0, $44 = 0;
 var $45 = 0, $46 = 0, $47 = 0, $48 = 0, $49 = 0, $5 = 0, $50 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, $alpha1 = 0.0, $alpha2 = 0.0, $bit1 = 0, $bit2 = 0, $bytes = 0, $i = 0, $quant1 = 0, $quant2 = 0, label = 0;
 var sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 48|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $0 = $rgba;
 $1 = $mask;
 $2 = $block;
 $3 = $2;
 $bytes = $3;
 $i = 0;
 while(1) {
  $4 = $i;
  $5 = ($4|0)<(8);
  if (!($5)) {
   break;
  }
  $6 = $i;
  $7 = $6<<3;
  $8 = (($7) + 3)|0;
  $9 = $0;
  $10 = (($9) + ($8)|0);
  $11 = HEAP8[$10>>0]|0;
  $12 = (+($11&255));
  $13 = $12 * 0.058823529630899429;
  $alpha1 = $13;
  $14 = $i;
  $15 = $14<<3;
  $16 = (($15) + 7)|0;
  $17 = $0;
  $18 = (($17) + ($16)|0);
  $19 = HEAP8[$18>>0]|0;
  $20 = (+($19&255));
  $21 = $20 * 0.058823529630899429;
  $alpha2 = $21;
  $22 = $alpha1;
  $23 = (__ZN6squishL10FloatToIntEfi($22,15)|0);
  $quant1 = $23;
  $24 = $alpha2;
  $25 = (__ZN6squishL10FloatToIntEfi($24,15)|0);
  $quant2 = $25;
  $26 = $i;
  $27 = $26<<1;
  $28 = 1 << $27;
  $bit1 = $28;
  $29 = $i;
  $30 = $29<<1;
  $31 = (($30) + 1)|0;
  $32 = 1 << $31;
  $bit2 = $32;
  $33 = $1;
  $34 = $bit1;
  $35 = $33 & $34;
  $36 = ($35|0)==(0);
  if ($36) {
   $quant1 = 0;
  }
  $37 = $1;
  $38 = $bit2;
  $39 = $37 & $38;
  $40 = ($39|0)==(0);
  if ($40) {
   $quant2 = 0;
  }
  $41 = $quant1;
  $42 = $quant2;
  $43 = $42 << 4;
  $44 = $41 | $43;
  $45 = $44&255;
  $46 = $i;
  $47 = $bytes;
  $48 = (($47) + ($46)|0);
  HEAP8[$48>>0] = $45;
  $49 = $i;
  $50 = (($49) + 1)|0;
  $i = $50;
 }
 STACKTOP = sp;return;
}
function __ZN6squishL10FloatToIntEfi($a,$limit) {
 $a = +$a;
 $limit = $limit|0;
 var $0 = 0.0, $1 = 0, $10 = 0, $11 = 0, $2 = 0.0, $3 = 0.0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, $i = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $0 = $a;
 $1 = $limit;
 $2 = $0;
 $3 = $2 + 0.5;
 $4 = (~~(($3)));
 $i = $4;
 $5 = $i;
 $6 = ($5|0)<(0);
 if ($6) {
  $i = 0;
  $11 = $i;
  STACKTOP = sp;return ($11|0);
 }
 $7 = $i;
 $8 = $1;
 $9 = ($7|0)>($8|0);
 if ($9) {
  $10 = $1;
  $i = $10;
 }
 $11 = $i;
 STACKTOP = sp;return ($11|0);
}
function __ZN6squish19DecompressAlphaDxt3EPhPKv($rgba,$block) {
 $rgba = $rgba|0;
 $block = $block|0;
 var $0 = 0, $1 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $2 = 0, $20 = 0, $21 = 0, $22 = 0, $23 = 0, $24 = 0, $25 = 0, $26 = 0;
 var $27 = 0, $28 = 0, $29 = 0, $3 = 0, $30 = 0, $31 = 0, $32 = 0, $33 = 0, $34 = 0, $35 = 0, $36 = 0, $37 = 0, $38 = 0, $39 = 0, $4 = 0, $40 = 0, $41 = 0, $42 = 0, $5 = 0, $6 = 0;
 var $7 = 0, $8 = 0, $9 = 0, $bytes = 0, $hi = 0, $i = 0, $lo = 0, $quant = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 32|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $0 = $rgba;
 $1 = $block;
 $2 = $1;
 $bytes = $2;
 $i = 0;
 while(1) {
  $3 = $i;
  $4 = ($3|0)<(8);
  if (!($4)) {
   break;
  }
  $5 = $i;
  $6 = $bytes;
  $7 = (($6) + ($5)|0);
  $8 = HEAP8[$7>>0]|0;
  $quant = $8;
  $9 = $quant;
  $10 = $9&255;
  $11 = $10 & 15;
  $12 = $11&255;
  $lo = $12;
  $13 = $quant;
  $14 = $13&255;
  $15 = $14 & 240;
  $16 = $15&255;
  $hi = $16;
  $17 = $lo;
  $18 = $17&255;
  $19 = $lo;
  $20 = $19&255;
  $21 = $20 << 4;
  $22 = $18 | $21;
  $23 = $22&255;
  $24 = $i;
  $25 = $24<<3;
  $26 = (($25) + 3)|0;
  $27 = $0;
  $28 = (($27) + ($26)|0);
  HEAP8[$28>>0] = $23;
  $29 = $hi;
  $30 = $29&255;
  $31 = $hi;
  $32 = $31&255;
  $33 = $32 >> 4;
  $34 = $30 | $33;
  $35 = $34&255;
  $36 = $i;
  $37 = $36<<3;
  $38 = (($37) + 7)|0;
  $39 = $0;
  $40 = (($39) + ($38)|0);
  HEAP8[$40>>0] = $35;
  $41 = $i;
  $42 = (($41) + 1)|0;
  $i = $42;
 }
 STACKTOP = sp;return;
}
function __ZN6squish17CompressAlphaDxt5EPKhiPv($rgba,$mask,$block) {
 $rgba = $rgba|0;
 $mask = $mask|0;
 $block = $block|0;
 var $0 = 0, $1 = 0, $10 = 0, $100 = 0, $101 = 0, $102 = 0, $103 = 0, $104 = 0, $105 = 0, $106 = 0, $107 = 0, $108 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0;
 var $19 = 0, $2 = 0, $20 = 0, $21 = 0, $22 = 0, $23 = 0, $24 = 0, $25 = 0, $26 = 0, $27 = 0, $28 = 0, $29 = 0, $3 = 0, $30 = 0, $31 = 0, $32 = 0, $33 = 0, $34 = 0, $35 = 0, $36 = 0;
 var $37 = 0, $38 = 0, $39 = 0, $4 = 0, $40 = 0, $41 = 0, $42 = 0, $43 = 0, $44 = 0, $45 = 0, $46 = 0, $47 = 0, $48 = 0, $49 = 0, $5 = 0, $50 = 0, $51 = 0, $52 = 0, $53 = 0, $54 = 0;
 var $55 = 0, $56 = 0, $57 = 0, $58 = 0, $59 = 0, $6 = 0, $60 = 0, $61 = 0, $62 = 0, $63 = 0, $64 = 0, $65 = 0, $66 = 0, $67 = 0, $68 = 0, $69 = 0, $7 = 0, $70 = 0, $71 = 0, $72 = 0;
 var $73 = 0, $74 = 0, $75 = 0, $76 = 0, $77 = 0, $78 = 0, $79 = 0, $8 = 0, $80 = 0, $81 = 0, $82 = 0, $83 = 0, $84 = 0, $85 = 0, $86 = 0, $87 = 0, $88 = 0, $89 = 0, $9 = 0, $90 = 0;
 var $91 = 0, $92 = 0, $93 = 0, $94 = 0, $95 = 0, $96 = 0, $97 = 0, $98 = 0, $99 = 0, $bit = 0, $codes5 = 0, $codes7 = 0, $err5 = 0, $err7 = 0, $i = 0, $i1 = 0, $i2 = 0, $indices5 = 0, $indices7 = 0, $max5 = 0;
 var $max7 = 0, $min5 = 0, $min7 = 0, $value = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 112|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $min5 = sp + 40|0;
 $max5 = sp + 36|0;
 $min7 = sp + 32|0;
 $max7 = sp + 28|0;
 $codes5 = sp + 96|0;
 $codes7 = sp + 88|0;
 $indices5 = sp + 72|0;
 $indices7 = sp + 56|0;
 $0 = $rgba;
 $1 = $mask;
 $2 = $block;
 HEAP32[$min5>>2] = 255;
 HEAP32[$max5>>2] = 0;
 HEAP32[$min7>>2] = 255;
 HEAP32[$max7>>2] = 0;
 $i = 0;
 while(1) {
  $3 = $i;
  $4 = ($3|0)<(16);
  if (!($4)) {
   break;
  }
  $5 = $i;
  $6 = 1 << $5;
  $bit = $6;
  $7 = $1;
  $8 = $bit;
  $9 = $7 & $8;
  $10 = ($9|0)==(0);
  if ($10) {
  } else {
   $11 = $i;
   $12 = $11<<2;
   $13 = (($12) + 3)|0;
   $14 = $0;
   $15 = (($14) + ($13)|0);
   $16 = HEAP8[$15>>0]|0;
   $17 = $16&255;
   $value = $17;
   $18 = $value;
   $19 = HEAP32[$min7>>2]|0;
   $20 = ($18|0)<($19|0);
   if ($20) {
    $21 = $value;
    HEAP32[$min7>>2] = $21;
   }
   $22 = $value;
   $23 = HEAP32[$max7>>2]|0;
   $24 = ($22|0)>($23|0);
   if ($24) {
    $25 = $value;
    HEAP32[$max7>>2] = $25;
   }
   $26 = $value;
   $27 = ($26|0)!=(0);
   if ($27) {
    $28 = $value;
    $29 = HEAP32[$min5>>2]|0;
    $30 = ($28|0)<($29|0);
    if ($30) {
     $31 = $value;
     HEAP32[$min5>>2] = $31;
    }
   }
   $32 = $value;
   $33 = ($32|0)!=(255);
   if ($33) {
    $34 = $value;
    $35 = HEAP32[$max5>>2]|0;
    $36 = ($34|0)>($35|0);
    if ($36) {
     $37 = $value;
     HEAP32[$max5>>2] = $37;
    }
   }
  }
  $38 = $i;
  $39 = (($38) + 1)|0;
  $i = $39;
 }
 $40 = HEAP32[$min5>>2]|0;
 $41 = HEAP32[$max5>>2]|0;
 $42 = ($40|0)>($41|0);
 if ($42) {
  $43 = HEAP32[$max5>>2]|0;
  HEAP32[$min5>>2] = $43;
 }
 $44 = HEAP32[$min7>>2]|0;
 $45 = HEAP32[$max7>>2]|0;
 $46 = ($44|0)>($45|0);
 if ($46) {
  $47 = HEAP32[$max7>>2]|0;
  HEAP32[$min7>>2] = $47;
 }
 __ZN6squishL8FixRangeERiS0_i($min5,$max5,5);
 __ZN6squishL8FixRangeERiS0_i($min7,$max7,7);
 $48 = HEAP32[$min5>>2]|0;
 $49 = $48&255;
 HEAP8[$codes5>>0] = $49;
 $50 = HEAP32[$max5>>2]|0;
 $51 = $50&255;
 $52 = (($codes5) + 1|0);
 HEAP8[$52>>0] = $51;
 $i1 = 1;
 while(1) {
  $53 = $i1;
  $54 = ($53|0)<(5);
  if (!($54)) {
   break;
  }
  $55 = $i1;
  $56 = (5 - ($55))|0;
  $57 = HEAP32[$min5>>2]|0;
  $58 = Math_imul($56, $57)|0;
  $59 = $i1;
  $60 = HEAP32[$max5>>2]|0;
  $61 = Math_imul($59, $60)|0;
  $62 = (($58) + ($61))|0;
  $63 = (($62|0) / 5)&-1;
  $64 = $63&255;
  $65 = $i1;
  $66 = (1 + ($65))|0;
  $67 = (($codes5) + ($66)|0);
  HEAP8[$67>>0] = $64;
  $68 = $i1;
  $69 = (($68) + 1)|0;
  $i1 = $69;
 }
 $70 = (($codes5) + 6|0);
 HEAP8[$70>>0] = 0;
 $71 = (($codes5) + 7|0);
 HEAP8[$71>>0] = -1;
 $72 = HEAP32[$min7>>2]|0;
 $73 = $72&255;
 HEAP8[$codes7>>0] = $73;
 $74 = HEAP32[$max7>>2]|0;
 $75 = $74&255;
 $76 = (($codes7) + 1|0);
 HEAP8[$76>>0] = $75;
 $i2 = 1;
 while(1) {
  $77 = $i2;
  $78 = ($77|0)<(7);
  if (!($78)) {
   break;
  }
  $79 = $i2;
  $80 = (7 - ($79))|0;
  $81 = HEAP32[$min7>>2]|0;
  $82 = Math_imul($80, $81)|0;
  $83 = $i2;
  $84 = HEAP32[$max7>>2]|0;
  $85 = Math_imul($83, $84)|0;
  $86 = (($82) + ($85))|0;
  $87 = (($86|0) / 7)&-1;
  $88 = $87&255;
  $89 = $i2;
  $90 = (1 + ($89))|0;
  $91 = (($codes7) + ($90)|0);
  HEAP8[$91>>0] = $88;
  $92 = $i2;
  $93 = (($92) + 1)|0;
  $i2 = $93;
 }
 $94 = $0;
 $95 = $1;
 $96 = (__ZN6squishL8FitCodesEPKhiS1_Ph($94,$95,$codes5,$indices5)|0);
 $err5 = $96;
 $97 = $0;
 $98 = $1;
 $99 = (__ZN6squishL8FitCodesEPKhiS1_Ph($97,$98,$codes7,$indices7)|0);
 $err7 = $99;
 $100 = $err5;
 $101 = $err7;
 $102 = ($100|0)<=($101|0);
 if ($102) {
  $103 = HEAP32[$min5>>2]|0;
  $104 = HEAP32[$max5>>2]|0;
  $105 = $2;
  __ZN6squishL16WriteAlphaBlock5EiiPKhPv($103,$104,$indices5,$105);
  STACKTOP = sp;return;
 } else {
  $106 = HEAP32[$min7>>2]|0;
  $107 = HEAP32[$max7>>2]|0;
  $108 = $2;
  __ZN6squishL16WriteAlphaBlock7EiiPKhPv($106,$107,$indices7,$108);
  STACKTOP = sp;return;
 }
}
function __ZN6squishL8FixRangeERiS0_i($min,$max,$steps) {
 $min = $min|0;
 $max = $max|0;
 $steps = $steps|0;
 var $0 = 0, $1 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $2 = 0, $20 = 0, $21 = 0, $22 = 0, $23 = 0, $24 = 0, $25 = 0, $26 = 0;
 var $27 = 0, $28 = 0, $29 = 0, $3 = 0, $30 = 0, $31 = 0, $32 = 0, $33 = 0, $34 = 0, $35 = 0, $36 = 0, $37 = 0, $38 = 0, $39 = 0, $4 = 0, $40 = 0, $41 = 0, $42 = 0, $43 = 0, $44 = 0;
 var $45 = 0, $46 = 0, $47 = 0, $48 = 0, $49 = 0, $5 = 0, $50 = 0, $51 = 0, $52 = 0, $53 = 0, $54 = 0, $55 = 0, $56 = 0, $57 = 0, $58 = 0, $59 = 0, $6 = 0, $60 = 0, $61 = 0, $62 = 0;
 var $63 = 0, $64 = 0, $65 = 0, $66 = 0, $67 = 0, $68 = 0, $69 = 0, $7 = 0, $70 = 0, $71 = 0, $72 = 0, $73 = 0, $74 = 0, $8 = 0, $9 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 112|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $5 = sp + 8|0;
 $8 = sp + 97|0;
 $14 = sp;
 $17 = sp + 96|0;
 $21 = sp + 24|0;
 $22 = sp + 20|0;
 $23 = sp + 16|0;
 $24 = sp + 12|0;
 $18 = $min;
 $19 = $max;
 $20 = $steps;
 $25 = $19;
 $26 = HEAP32[$25>>2]|0;
 $27 = $18;
 $28 = HEAP32[$27>>2]|0;
 $29 = (($26) - ($28))|0;
 $30 = $20;
 $31 = ($29|0)<($30|0);
 if ($31) {
  $32 = $18;
  $33 = HEAP32[$32>>2]|0;
  $34 = $20;
  $35 = (($33) + ($34))|0;
  HEAP32[$21>>2] = $35;
  HEAP32[$22>>2] = 255;
  $15 = $21;
  $16 = $22;
  $36 = $15;
  $37 = $16;
  ;HEAP8[$14+0>>0]=HEAP8[$17+0>>0]|0;
  $12 = $36;
  $13 = $37;
  $38 = $13;
  $39 = $12;
  $9 = $14;
  $10 = $38;
  $11 = $39;
  $40 = $10;
  $41 = HEAP32[$40>>2]|0;
  $42 = $11;
  $43 = HEAP32[$42>>2]|0;
  $44 = ($41|0)<($43|0);
  if ($44) {
   $45 = $13;
   $48 = $45;
  } else {
   $46 = $12;
   $48 = $46;
  }
  $47 = HEAP32[$48>>2]|0;
  $49 = $19;
  HEAP32[$49>>2] = $47;
 }
 $50 = $19;
 $51 = HEAP32[$50>>2]|0;
 $52 = $18;
 $53 = HEAP32[$52>>2]|0;
 $54 = (($51) - ($53))|0;
 $55 = $20;
 $56 = ($54|0)<($55|0);
 if (!($56)) {
  STACKTOP = sp;return;
 }
 HEAP32[$23>>2] = 0;
 $57 = $19;
 $58 = HEAP32[$57>>2]|0;
 $59 = $20;
 $60 = (($58) - ($59))|0;
 HEAP32[$24>>2] = $60;
 $6 = $23;
 $7 = $24;
 $61 = $6;
 $62 = $7;
 ;HEAP8[$5+0>>0]=HEAP8[$8+0>>0]|0;
 $3 = $61;
 $4 = $62;
 $63 = $3;
 $64 = $4;
 $0 = $5;
 $1 = $63;
 $2 = $64;
 $65 = $1;
 $66 = HEAP32[$65>>2]|0;
 $67 = $2;
 $68 = HEAP32[$67>>2]|0;
 $69 = ($66|0)<($68|0);
 if ($69) {
  $70 = $4;
  $73 = $70;
 } else {
  $71 = $3;
  $73 = $71;
 }
 $72 = HEAP32[$73>>2]|0;
 $74 = $18;
 HEAP32[$74>>2] = $72;
 STACKTOP = sp;return;
}
function __ZN6squishL8FitCodesEPKhiS1_Ph($rgba,$mask,$codes,$indices) {
 $rgba = $rgba|0;
 $mask = $mask|0;
 $codes = $codes|0;
 $indices = $indices|0;
 var $0 = 0, $1 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $2 = 0, $20 = 0, $21 = 0, $22 = 0, $23 = 0, $24 = 0, $25 = 0, $26 = 0;
 var $27 = 0, $28 = 0, $29 = 0, $3 = 0, $30 = 0, $31 = 0, $32 = 0, $33 = 0, $34 = 0, $35 = 0, $36 = 0, $37 = 0, $38 = 0, $39 = 0, $4 = 0, $40 = 0, $41 = 0, $42 = 0, $43 = 0, $44 = 0;
 var $45 = 0, $46 = 0, $47 = 0, $48 = 0, $49 = 0, $5 = 0, $50 = 0, $51 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, $bit = 0, $dist = 0, $err = 0, $i = 0, $index = 0, $j = 0, $least = 0, $value = 0;
 var label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 48|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $0 = $rgba;
 $1 = $mask;
 $2 = $codes;
 $3 = $indices;
 $err = 0;
 $i = 0;
 while(1) {
  $4 = $i;
  $5 = ($4|0)<(16);
  if (!($5)) {
   break;
  }
  $6 = $i;
  $7 = 1 << $6;
  $bit = $7;
  $8 = $1;
  $9 = $bit;
  $10 = $8 & $9;
  $11 = ($10|0)==(0);
  if ($11) {
   $12 = $i;
   $13 = $3;
   $14 = (($13) + ($12)|0);
   HEAP8[$14>>0] = 0;
  } else {
   $15 = $i;
   $16 = $15<<2;
   $17 = (($16) + 3)|0;
   $18 = $0;
   $19 = (($18) + ($17)|0);
   $20 = HEAP8[$19>>0]|0;
   $21 = $20&255;
   $value = $21;
   $least = 2147483647;
   $index = 0;
   $j = 0;
   while(1) {
    $22 = $j;
    $23 = ($22|0)<(8);
    if (!($23)) {
     break;
    }
    $24 = $value;
    $25 = $j;
    $26 = $2;
    $27 = (($26) + ($25)|0);
    $28 = HEAP8[$27>>0]|0;
    $29 = $28&255;
    $30 = (($24) - ($29))|0;
    $dist = $30;
    $31 = $dist;
    $32 = $dist;
    $33 = Math_imul($32, $31)|0;
    $dist = $33;
    $34 = $dist;
    $35 = $least;
    $36 = ($34|0)<($35|0);
    if ($36) {
     $37 = $dist;
     $least = $37;
     $38 = $j;
     $index = $38;
    }
    $39 = $j;
    $40 = (($39) + 1)|0;
    $j = $40;
   }
   $41 = $index;
   $42 = $41&255;
   $43 = $i;
   $44 = $3;
   $45 = (($44) + ($43)|0);
   HEAP8[$45>>0] = $42;
   $46 = $least;
   $47 = $err;
   $48 = (($47) + ($46))|0;
   $err = $48;
  }
  $49 = $i;
  $50 = (($49) + 1)|0;
  $i = $50;
 }
 $51 = $err;
 STACKTOP = sp;return ($51|0);
}
function __ZN6squishL16WriteAlphaBlock5EiiPKhPv($alpha0,$alpha1,$indices,$block) {
 $alpha0 = $alpha0|0;
 $alpha1 = $alpha1|0;
 $indices = $indices|0;
 $block = $block|0;
 var $0 = 0, $1 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $2 = 0, $20 = 0, $21 = 0, $22 = 0, $23 = 0, $24 = 0, $25 = 0, $26 = 0;
 var $27 = 0, $28 = 0, $29 = 0, $3 = 0, $30 = 0, $31 = 0, $32 = 0, $33 = 0, $34 = 0, $35 = 0, $36 = 0, $37 = 0, $38 = 0, $39 = 0, $4 = 0, $40 = 0, $41 = 0, $42 = 0, $43 = 0, $5 = 0;
 var $6 = 0, $7 = 0, $8 = 0, $9 = 0, $i = 0, $index = 0, $swapped = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 48|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $swapped = sp + 24|0;
 $0 = $alpha0;
 $1 = $alpha1;
 $2 = $indices;
 $3 = $block;
 $4 = $0;
 $5 = $1;
 $6 = ($4|0)>($5|0);
 if (!($6)) {
  $40 = $0;
  $41 = $1;
  $42 = $2;
  $43 = $3;
  __ZN6squishL15WriteAlphaBlockEiiPKhPv($40,$41,$42,$43);
  STACKTOP = sp;return;
 }
 $i = 0;
 while(1) {
  $7 = $i;
  $8 = ($7|0)<(16);
  if (!($8)) {
   break;
  }
  $9 = $i;
  $10 = $2;
  $11 = (($10) + ($9)|0);
  $12 = HEAP8[$11>>0]|0;
  $index = $12;
  $13 = $index;
  $14 = $13&255;
  $15 = ($14|0)==(0);
  if ($15) {
   $16 = $i;
   $17 = (($swapped) + ($16)|0);
   HEAP8[$17>>0] = 1;
  } else {
   $18 = $index;
   $19 = $18&255;
   $20 = ($19|0)==(1);
   if ($20) {
    $21 = $i;
    $22 = (($swapped) + ($21)|0);
    HEAP8[$22>>0] = 0;
   } else {
    $23 = $index;
    $24 = $23&255;
    $25 = ($24|0)<=(5);
    if ($25) {
     $26 = $index;
     $27 = $26&255;
     $28 = (7 - ($27))|0;
     $29 = $28&255;
     $30 = $i;
     $31 = (($swapped) + ($30)|0);
     HEAP8[$31>>0] = $29;
    } else {
     $32 = $index;
     $33 = $i;
     $34 = (($swapped) + ($33)|0);
     HEAP8[$34>>0] = $32;
    }
   }
  }
  $35 = $i;
  $36 = (($35) + 1)|0;
  $i = $36;
 }
 $37 = $1;
 $38 = $0;
 $39 = $3;
 __ZN6squishL15WriteAlphaBlockEiiPKhPv($37,$38,$swapped,$39);
 STACKTOP = sp;return;
}
function __ZN6squishL16WriteAlphaBlock7EiiPKhPv($alpha0,$alpha1,$indices,$block) {
 $alpha0 = $alpha0|0;
 $alpha1 = $alpha1|0;
 $indices = $indices|0;
 $block = $block|0;
 var $0 = 0, $1 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $2 = 0, $20 = 0, $21 = 0, $22 = 0, $23 = 0, $24 = 0, $25 = 0, $26 = 0;
 var $27 = 0, $28 = 0, $29 = 0, $3 = 0, $30 = 0, $31 = 0, $32 = 0, $33 = 0, $34 = 0, $35 = 0, $36 = 0, $37 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, $i = 0, $index = 0;
 var $swapped = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 48|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $swapped = sp + 24|0;
 $0 = $alpha0;
 $1 = $alpha1;
 $2 = $indices;
 $3 = $block;
 $4 = $0;
 $5 = $1;
 $6 = ($4|0)<($5|0);
 if (!($6)) {
  $34 = $0;
  $35 = $1;
  $36 = $2;
  $37 = $3;
  __ZN6squishL15WriteAlphaBlockEiiPKhPv($34,$35,$36,$37);
  STACKTOP = sp;return;
 }
 $i = 0;
 while(1) {
  $7 = $i;
  $8 = ($7|0)<(16);
  if (!($8)) {
   break;
  }
  $9 = $i;
  $10 = $2;
  $11 = (($10) + ($9)|0);
  $12 = HEAP8[$11>>0]|0;
  $index = $12;
  $13 = $index;
  $14 = $13&255;
  $15 = ($14|0)==(0);
  if ($15) {
   $16 = $i;
   $17 = (($swapped) + ($16)|0);
   HEAP8[$17>>0] = 1;
  } else {
   $18 = $index;
   $19 = $18&255;
   $20 = ($19|0)==(1);
   if ($20) {
    $21 = $i;
    $22 = (($swapped) + ($21)|0);
    HEAP8[$22>>0] = 0;
   } else {
    $23 = $index;
    $24 = $23&255;
    $25 = (9 - ($24))|0;
    $26 = $25&255;
    $27 = $i;
    $28 = (($swapped) + ($27)|0);
    HEAP8[$28>>0] = $26;
   }
  }
  $29 = $i;
  $30 = (($29) + 1)|0;
  $i = $30;
 }
 $31 = $1;
 $32 = $0;
 $33 = $3;
 __ZN6squishL15WriteAlphaBlockEiiPKhPv($31,$32,$swapped,$33);
 STACKTOP = sp;return;
}
function __ZN6squish19DecompressAlphaDxt5EPhPKv($rgba,$block) {
 $rgba = $rgba|0;
 $block = $block|0;
 var $0 = 0, $1 = 0, $10 = 0, $100 = 0, $101 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $2 = 0, $20 = 0, $21 = 0, $22 = 0, $23 = 0, $24 = 0;
 var $25 = 0, $26 = 0, $27 = 0, $28 = 0, $29 = 0, $3 = 0, $30 = 0, $31 = 0, $32 = 0, $33 = 0, $34 = 0, $35 = 0, $36 = 0, $37 = 0, $38 = 0, $39 = 0, $4 = 0, $40 = 0, $41 = 0, $42 = 0;
 var $43 = 0, $44 = 0, $45 = 0, $46 = 0, $47 = 0, $48 = 0, $49 = 0, $5 = 0, $50 = 0, $51 = 0, $52 = 0, $53 = 0, $54 = 0, $55 = 0, $56 = 0, $57 = 0, $58 = 0, $59 = 0, $6 = 0, $60 = 0;
 var $61 = 0, $62 = 0, $63 = 0, $64 = 0, $65 = 0, $66 = 0, $67 = 0, $68 = 0, $69 = 0, $7 = 0, $70 = 0, $71 = 0, $72 = 0, $73 = 0, $74 = 0, $75 = 0, $76 = 0, $77 = 0, $78 = 0, $79 = 0;
 var $8 = 0, $80 = 0, $81 = 0, $82 = 0, $83 = 0, $84 = 0, $85 = 0, $86 = 0, $87 = 0, $88 = 0, $89 = 0, $9 = 0, $90 = 0, $91 = 0, $92 = 0, $93 = 0, $94 = 0, $95 = 0, $96 = 0, $97 = 0;
 var $98 = 0, $99 = 0, $alpha0 = 0, $alpha1 = 0, $byte = 0, $bytes = 0, $codes = 0, $dest = 0, $i = 0, $i1 = 0, $i2 = 0, $i4 = 0, $index = 0, $indices = 0, $j = 0, $j3 = 0, $src = 0, $value = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 96|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $codes = sp + 80|0;
 $indices = sp + 64|0;
 $0 = $rgba;
 $1 = $block;
 $2 = $1;
 $bytes = $2;
 $3 = $bytes;
 $4 = HEAP8[$3>>0]|0;
 $5 = $4&255;
 $alpha0 = $5;
 $6 = $bytes;
 $7 = (($6) + 1|0);
 $8 = HEAP8[$7>>0]|0;
 $9 = $8&255;
 $alpha1 = $9;
 $10 = $alpha0;
 $11 = $10&255;
 HEAP8[$codes>>0] = $11;
 $12 = $alpha1;
 $13 = $12&255;
 $14 = (($codes) + 1|0);
 HEAP8[$14>>0] = $13;
 $15 = $alpha0;
 $16 = $alpha1;
 $17 = ($15|0)<=($16|0);
 if ($17) {
  $i = 1;
  while(1) {
   $18 = $i;
   $19 = ($18|0)<(5);
   if (!($19)) {
    break;
   }
   $20 = $i;
   $21 = (5 - ($20))|0;
   $22 = $alpha0;
   $23 = Math_imul($21, $22)|0;
   $24 = $i;
   $25 = $alpha1;
   $26 = Math_imul($24, $25)|0;
   $27 = (($23) + ($26))|0;
   $28 = (($27|0) / 5)&-1;
   $29 = $28&255;
   $30 = $i;
   $31 = (1 + ($30))|0;
   $32 = (($codes) + ($31)|0);
   HEAP8[$32>>0] = $29;
   $33 = $i;
   $34 = (($33) + 1)|0;
   $i = $34;
  }
  $35 = (($codes) + 6|0);
  HEAP8[$35>>0] = 0;
  $36 = (($codes) + 7|0);
  HEAP8[$36>>0] = -1;
 } else {
  $i1 = 1;
  while(1) {
   $37 = $i1;
   $38 = ($37|0)<(7);
   if (!($38)) {
    break;
   }
   $39 = $i1;
   $40 = (7 - ($39))|0;
   $41 = $alpha0;
   $42 = Math_imul($40, $41)|0;
   $43 = $i1;
   $44 = $alpha1;
   $45 = Math_imul($43, $44)|0;
   $46 = (($42) + ($45))|0;
   $47 = (($46|0) / 7)&-1;
   $48 = $47&255;
   $49 = $i1;
   $50 = (1 + ($49))|0;
   $51 = (($codes) + ($50)|0);
   HEAP8[$51>>0] = $48;
   $52 = $i1;
   $53 = (($52) + 1)|0;
   $i1 = $53;
  }
 }
 $54 = $bytes;
 $55 = (($54) + 2|0);
 $src = $55;
 $dest = $indices;
 $i2 = 0;
 while(1) {
  $56 = $i2;
  $57 = ($56|0)<(2);
  if (!($57)) {
   break;
  }
  $value = 0;
  $j = 0;
  while(1) {
   $58 = $j;
   $59 = ($58|0)<(3);
   if (!($59)) {
    break;
   }
   $60 = $src;
   $61 = (($60) + 1|0);
   $src = $61;
   $62 = HEAP8[$60>>0]|0;
   $63 = $62&255;
   $byte = $63;
   $64 = $byte;
   $65 = $j;
   $66 = $65<<3;
   $67 = $64 << $66;
   $68 = $value;
   $69 = $68 | $67;
   $value = $69;
   $70 = $j;
   $71 = (($70) + 1)|0;
   $j = $71;
  }
  $j3 = 0;
  while(1) {
   $72 = $j3;
   $73 = ($72|0)<(8);
   if (!($73)) {
    break;
   }
   $74 = $value;
   $75 = $j3;
   $76 = ($75*3)|0;
   $77 = $74 >> $76;
   $78 = $77 & 7;
   $index = $78;
   $79 = $index;
   $80 = $79&255;
   $81 = $dest;
   $82 = (($81) + 1|0);
   $dest = $82;
   HEAP8[$81>>0] = $80;
   $83 = $j3;
   $84 = (($83) + 1)|0;
   $j3 = $84;
  }
  $85 = $i2;
  $86 = (($85) + 1)|0;
  $i2 = $86;
 }
 $i4 = 0;
 while(1) {
  $87 = $i4;
  $88 = ($87|0)<(16);
  if (!($88)) {
   break;
  }
  $89 = $i4;
  $90 = (($indices) + ($89)|0);
  $91 = HEAP8[$90>>0]|0;
  $92 = $91&255;
  $93 = (($codes) + ($92)|0);
  $94 = HEAP8[$93>>0]|0;
  $95 = $i4;
  $96 = $95<<2;
  $97 = (($96) + 3)|0;
  $98 = $0;
  $99 = (($98) + ($97)|0);
  HEAP8[$99>>0] = $94;
  $100 = $i4;
  $101 = (($100) + 1)|0;
  $i4 = $101;
 }
 STACKTOP = sp;return;
}
function __ZN6squishL15WriteAlphaBlockEiiPKhPv($alpha0,$alpha1,$indices,$block) {
 $alpha0 = $alpha0|0;
 $alpha1 = $alpha1|0;
 $indices = $indices|0;
 $block = $block|0;
 var $0 = 0, $1 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $2 = 0, $20 = 0, $21 = 0, $22 = 0, $23 = 0, $24 = 0, $25 = 0, $26 = 0;
 var $27 = 0, $28 = 0, $29 = 0, $3 = 0, $30 = 0, $31 = 0, $32 = 0, $33 = 0, $34 = 0, $35 = 0, $36 = 0, $37 = 0, $38 = 0, $39 = 0, $4 = 0, $40 = 0, $41 = 0, $42 = 0, $43 = 0, $44 = 0;
 var $45 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, $byte = 0, $bytes = 0, $dest = 0, $i = 0, $index = 0, $j = 0, $j1 = 0, $src = 0, $value = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 64|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $0 = $alpha0;
 $1 = $alpha1;
 $2 = $indices;
 $3 = $block;
 $4 = $3;
 $bytes = $4;
 $5 = $0;
 $6 = $5&255;
 $7 = $bytes;
 HEAP8[$7>>0] = $6;
 $8 = $1;
 $9 = $8&255;
 $10 = $bytes;
 $11 = (($10) + 1|0);
 HEAP8[$11>>0] = $9;
 $12 = $bytes;
 $13 = (($12) + 2|0);
 $dest = $13;
 $14 = $2;
 $src = $14;
 $i = 0;
 while(1) {
  $15 = $i;
  $16 = ($15|0)<(2);
  if (!($16)) {
   break;
  }
  $value = 0;
  $j = 0;
  while(1) {
   $17 = $j;
   $18 = ($17|0)<(8);
   if (!($18)) {
    break;
   }
   $19 = $src;
   $20 = (($19) + 1|0);
   $src = $20;
   $21 = HEAP8[$19>>0]|0;
   $22 = $21&255;
   $index = $22;
   $23 = $index;
   $24 = $j;
   $25 = ($24*3)|0;
   $26 = $23 << $25;
   $27 = $value;
   $28 = $27 | $26;
   $value = $28;
   $29 = $j;
   $30 = (($29) + 1)|0;
   $j = $30;
  }
  $j1 = 0;
  while(1) {
   $31 = $j1;
   $32 = ($31|0)<(3);
   if (!($32)) {
    break;
   }
   $33 = $value;
   $34 = $j1;
   $35 = $34<<3;
   $36 = $33 >> $35;
   $37 = $36 & 255;
   $byte = $37;
   $38 = $byte;
   $39 = $38&255;
   $40 = $dest;
   $41 = (($40) + 1|0);
   $dest = $41;
   HEAP8[$40>>0] = $39;
   $42 = $j1;
   $43 = (($42) + 1)|0;
   $j1 = $43;
  }
  $44 = $i;
  $45 = (($44) + 1)|0;
  $i = $45;
 }
 STACKTOP = sp;return;
}
function __ZN6squish10ClusterFitC2EPKNS_9ColourSetEi($this,$colours,$flags) {
 $this = $this|0;
 $colours = $colours|0;
 $flags = $flags|0;
 var $0 = 0, $1 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $2 = 0, $20 = 0, $21 = 0, $22 = 0, $23 = 0, $24 = 0, $25 = 0, $26 = 0;
 var $27 = 0, $28 = 0, $29 = 0, $3 = 0, $30 = 0, $31 = 0, $32 = 0, $33 = 0, $34 = 0, $35 = 0, $36 = 0, $37 = 0, $38 = 0, $39 = 0, $4 = 0, $40 = 0, $41 = 0, $42 = 0, $43 = 0, $44 = 0;
 var $45 = 0, $46 = 0, $47 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, $count = 0, $covariance = 0, $perceptual = 0, $values = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 112|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $3 = sp + 80|0;
 $4 = sp + 64|0;
 $5 = sp + 48|0;
 $covariance = sp + 16|0;
 $6 = sp;
 $0 = $this;
 $1 = $colours;
 $2 = $flags;
 $7 = $0;
 $8 = $1;
 $9 = $2;
 __ZN6squish9ColourFitC2EPKNS_9ColourSetEi($7,$8,$9);
 $10 = (8 + 8|0);
 HEAP32[$7>>2] = $10;
 $11 = (($7) + 16|0);
 __ZN6squish4Vec3C2Ev($11);
 $12 = (($7) + 156|0);
 $13 = (($12) + 256|0);
 $14 = $12;
 while(1) {
  __ZN6squish4Vec4C2Ev($14);
  $15 = (($14) + 16|0);
  $16 = ($15|0)==($13|0);
  if ($16) {
   break;
  } else {
   $14 = $15;
  }
 }
 $17 = (($7) + 412|0);
 __ZN6squish4Vec4C2Ev($17);
 $18 = (($7) + 428|0);
 __ZN6squish4Vec4C2Ev($18);
 $19 = (($7) + 444|0);
 __ZN6squish4Vec4C2Ev($19);
 $20 = (($7) + 8|0);
 $21 = HEAP32[$20>>2]|0;
 $22 = $21 & 256;
 $23 = ($22|0)!=(0);
 $24 = $23 ? 8 : 1;
 $25 = (($7) + 12|0);
 HEAP32[$25>>2] = $24;
 $26 = (($7) + 444|0);
 __ZN6squish4Vec4C2Ef($3,3.4028234663852886E+38);
 ;HEAP32[$26+0>>2]=HEAP32[$3+0>>2]|0;HEAP32[$26+4>>2]=HEAP32[$3+4>>2]|0;HEAP32[$26+8>>2]=HEAP32[$3+8>>2]|0;HEAP32[$26+12>>2]=HEAP32[$3+12>>2]|0;
 $27 = (($7) + 8|0);
 $28 = HEAP32[$27>>2]|0;
 $29 = $28 & 32;
 $30 = ($29|0)!=(0);
 $31 = $30&1;
 $perceptual = $31;
 $32 = $perceptual;
 $33 = $32&1;
 if ($33) {
  $34 = (($7) + 428|0);
  __ZN6squish4Vec4C2Effff($4,0.2125999927520752,0.71520000696182251,0.072200000286102295,0.0);
  ;HEAP32[$34+0>>2]=HEAP32[$4+0>>2]|0;HEAP32[$34+4>>2]=HEAP32[$4+4>>2]|0;HEAP32[$34+8>>2]=HEAP32[$4+8>>2]|0;HEAP32[$34+12>>2]=HEAP32[$4+12>>2]|0;
 } else {
  $35 = (($7) + 428|0);
  __ZN6squish4Vec4C2Ef($5,1.0);
  ;HEAP32[$35+0>>2]=HEAP32[$5+0>>2]|0;HEAP32[$35+4>>2]=HEAP32[$5+4>>2]|0;HEAP32[$35+8>>2]=HEAP32[$5+8>>2]|0;HEAP32[$35+12>>2]=HEAP32[$5+12>>2]|0;
 }
 $36 = (($7) + 4|0);
 $37 = HEAP32[$36>>2]|0;
 $38 = (__ZNK6squish9ColourSet8GetCountEv($37)|0);
 $count = $38;
 $39 = (($7) + 4|0);
 $40 = HEAP32[$39>>2]|0;
 $41 = (__ZNK6squish9ColourSet9GetPointsEv($40)|0);
 $values = $41;
 $42 = $count;
 $43 = $values;
 $44 = (($7) + 4|0);
 $45 = HEAP32[$44>>2]|0;
 $46 = (__ZNK6squish9ColourSet10GetWeightsEv($45)|0);
 __ZN6squish25ComputeWeightedCovarianceEiPKNS_4Vec3EPKf($covariance,$42,$43,$46);
 $47 = (($7) + 16|0);
 __ZN6squish25ComputePrincipleComponentERKNS_6Sym3x3E($6,$covariance);
 ;HEAP32[$47+0>>2]=HEAP32[$6+0>>2]|0;HEAP32[$47+4>>2]=HEAP32[$6+4>>2]|0;HEAP32[$47+8>>2]=HEAP32[$6+8>>2]|0;
 STACKTOP = sp;return;
}
function __ZN6squish10ClusterFit17ConstructOrderingERKNS_4Vec3Ei($this,$axis,$iteration) {
 $this = $this|0;
 $axis = $axis|0;
 $iteration = $iteration|0;
 var $$expand_i1_val = 0, $$expand_i1_val2 = 0, $$pre_trunc = 0, $0 = 0, $1 = 0, $10 = 0, $100 = 0, $101 = 0, $102 = 0, $103 = 0, $104 = 0, $105 = 0, $106 = 0, $107 = 0, $108 = 0, $109 = 0, $11 = 0, $110 = 0, $111 = 0, $112 = 0;
 var $113 = 0, $114 = 0, $115 = 0, $116 = 0, $117 = 0, $118 = 0, $119 = 0, $12 = 0, $120 = 0, $121 = 0, $122 = 0, $123 = 0, $124 = 0, $125 = 0, $126 = 0, $127 = 0, $128 = 0, $129 = 0, $13 = 0, $130 = 0;
 var $131 = 0, $132 = 0, $133 = 0, $134 = 0, $135 = 0, $136 = 0, $137 = 0, $138 = 0.0, $139 = 0, $14 = 0, $140 = 0, $141 = 0, $142 = 0.0, $143 = 0, $144 = 0, $145 = 0, $146 = 0.0, $147 = 0, $148 = 0, $149 = 0;
 var $15 = 0, $150 = 0.0, $151 = 0, $152 = 0, $153 = 0, $154 = 0, $155 = 0, $156 = 0, $157 = 0, $158 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $2 = 0, $20 = 0, $21 = 0, $22 = 0, $23 = 0, $24 = 0;
 var $25 = 0, $26 = 0, $27 = 0, $28 = 0, $29 = 0, $3 = 0, $30 = 0, $31 = 0, $32 = 0, $33 = 0.0, $34 = 0, $35 = 0, $36 = 0, $37 = 0, $38 = 0, $39 = 0, $4 = 0, $40 = 0, $41 = 0, $42 = 0;
 var $43 = 0, $44 = 0, $45 = 0, $46 = 0, $47 = 0, $48 = 0, $49 = 0, $5 = 0, $50 = 0, $51 = 0.0, $52 = 0, $53 = 0, $54 = 0, $55 = 0.0, $56 = 0, $57 = 0, $58 = 0, $59 = 0, $6 = 0, $60 = 0;
 var $61 = 0, $62 = 0, $63 = 0, $64 = 0.0, $65 = 0, $66 = 0, $67 = 0.0, $68 = 0, $69 = 0, $7 = 0, $70 = 0.0, $71 = 0, $72 = 0, $73 = 0, $74 = 0, $75 = 0, $76 = 0, $77 = 0, $78 = 0, $79 = 0;
 var $8 = 0, $80 = 0, $81 = 0, $82 = 0, $83 = 0, $84 = 0, $85 = 0, $86 = 0, $87 = 0, $88 = 0, $89 = 0, $9 = 0, $90 = 0, $91 = 0, $92 = 0, $93 = 0, $94 = 0, $95 = 0, $96 = 0, $97 = 0;
 var $98 = 0, $99 = 0, $__t$i = 0, $__t$i5 = 0, $count = 0, $dps = 0, $i = 0, $i1 = 0, $i2 = 0, $i3 = 0, $it = 0, $j = 0, $j4 = 0, $order = 0, $p = 0, $prev = 0, $same = 0, $unweighted = 0, $values = 0, $w = 0;
 var $weights = 0, $x = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 256|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $__t$i5 = sp + 242|0;
 $__t$i = sp + 196|0;
 $dps = sp + 112|0;
 $14 = sp + 56|0;
 $p = sp + 32|0;
 $w = sp + 16|0;
 $x = sp;
 $11 = $this;
 $12 = $axis;
 $13 = $iteration;
 $15 = $11;
 $16 = (($15) + 4|0);
 $17 = HEAP32[$16>>2]|0;
 $18 = (__ZNK6squish9ColourSet8GetCountEv($17)|0);
 $count = $18;
 $19 = (($15) + 4|0);
 $20 = HEAP32[$19>>2]|0;
 $21 = (__ZNK6squish9ColourSet9GetPointsEv($20)|0);
 $values = $21;
 $22 = (($15) + 28|0);
 $23 = $13;
 $24 = $23<<4;
 $25 = (($22) + ($24)|0);
 $order = $25;
 $i = 0;
 while(1) {
  $26 = $i;
  $27 = $count;
  $28 = ($26|0)<($27|0);
  if (!($28)) {
   break;
  }
  $29 = $i;
  $30 = $values;
  $31 = (($30) + (($29*12)|0)|0);
  $32 = $12;
  $33 = (+__ZN6squish3DotERKNS_4Vec3ES2_($31,$32));
  $34 = $i;
  $35 = (($dps) + ($34<<2)|0);
  HEAPF32[$35>>2] = $33;
  $36 = $i;
  $37 = $36&255;
  $38 = $i;
  $39 = $order;
  $40 = (($39) + ($38)|0);
  HEAP8[$40>>0] = $37;
  $41 = $i;
  $42 = (($41) + 1)|0;
  $i = $42;
 }
 $i1 = 0;
 while(1) {
  $43 = $i1;
  $44 = $count;
  $45 = ($43|0)<($44|0);
  if (!($45)) {
   break;
  }
  $46 = $i1;
  $j = $46;
  while(1) {
   $47 = $j;
   $48 = ($47|0)>(0);
   if ($48) {
    $49 = $j;
    $50 = (($dps) + ($49<<2)|0);
    $51 = +HEAPF32[$50>>2];
    $52 = $j;
    $53 = (($52) - 1)|0;
    $54 = (($dps) + ($53<<2)|0);
    $55 = +HEAPF32[$54>>2];
    $56 = $51 < $55;
    $158 = $56;
   } else {
    $158 = 0;
   }
   if (!($158)) {
    break;
   }
   $57 = $j;
   $58 = (($dps) + ($57<<2)|0);
   $59 = $j;
   $60 = (($59) - 1)|0;
   $61 = (($dps) + ($60<<2)|0);
   $8 = $58;
   $9 = $61;
   $62 = $8;
   $7 = $62;
   $63 = $7;
   $64 = +HEAPF32[$63>>2];
   HEAPF32[$__t$i>>2] = $64;
   $65 = $9;
   $5 = $65;
   $66 = $5;
   $67 = +HEAPF32[$66>>2];
   $68 = $8;
   HEAPF32[$68>>2] = $67;
   $6 = $__t$i;
   $69 = $6;
   $70 = +HEAPF32[$69>>2];
   $71 = $9;
   HEAPF32[$71>>2] = $70;
   $72 = $j;
   $73 = $order;
   $74 = (($73) + ($72)|0);
   $75 = $j;
   $76 = (($75) - 1)|0;
   $77 = $order;
   $78 = (($77) + ($76)|0);
   $3 = $74;
   $4 = $78;
   $79 = $3;
   $2 = $79;
   $80 = $2;
   $81 = HEAP8[$80>>0]|0;
   HEAP8[$__t$i5>>0] = $81;
   $82 = $4;
   $0 = $82;
   $83 = $0;
   $84 = HEAP8[$83>>0]|0;
   $85 = $3;
   HEAP8[$85>>0] = $84;
   $1 = $__t$i5;
   $86 = $1;
   $87 = HEAP8[$86>>0]|0;
   $88 = $4;
   HEAP8[$88>>0] = $87;
   $89 = $j;
   $90 = (($89) + -1)|0;
   $j = $90;
  }
  $91 = $i1;
  $92 = (($91) + 1)|0;
  $i1 = $92;
 }
 $it = 0;
 while(1) {
  $93 = $it;
  $94 = $13;
  $95 = ($93|0)<($94|0);
  if (!($95)) {
   break;
  }
  $96 = (($15) + 28|0);
  $97 = $it;
  $98 = $97<<4;
  $99 = (($96) + ($98)|0);
  $prev = $99;
  $same = 1;
  $i2 = 0;
  while(1) {
   $100 = $i2;
   $101 = $count;
   $102 = ($100|0)<($101|0);
   if (!($102)) {
    break;
   }
   $103 = $i2;
   $104 = $order;
   $105 = (($104) + ($103)|0);
   $106 = HEAP8[$105>>0]|0;
   $107 = $106&255;
   $108 = $i2;
   $109 = $prev;
   $110 = (($109) + ($108)|0);
   $111 = HEAP8[$110>>0]|0;
   $112 = $111&255;
   $113 = ($107|0)!=($112|0);
   if ($113) {
    label = 20;
    break;
   }
   $114 = $i2;
   $115 = (($114) + 1)|0;
   $i2 = $115;
  }
  if ((label|0) == 20) {
   label = 0;
   $same = 0;
  }
  $116 = $same;
  $117 = $116&1;
  if ($117) {
   label = 24;
   break;
  }
  $118 = $it;
  $119 = (($118) + 1)|0;
  $it = $119;
 }
 if ((label|0) == 24) {
  $$expand_i1_val = 0;
  $10 = $$expand_i1_val;
  $$pre_trunc = $10;
  $157 = $$pre_trunc&1;
  STACKTOP = sp;return ($157|0);
 }
 $120 = (($15) + 4|0);
 $121 = HEAP32[$120>>2]|0;
 $122 = (__ZNK6squish9ColourSet9GetPointsEv($121)|0);
 $unweighted = $122;
 $123 = (($15) + 4|0);
 $124 = HEAP32[$123>>2]|0;
 $125 = (__ZNK6squish9ColourSet10GetWeightsEv($124)|0);
 $weights = $125;
 $126 = (($15) + 412|0);
 __ZN6squish4Vec4C2Ef($14,0.0);
 ;HEAP32[$126+0>>2]=HEAP32[$14+0>>2]|0;HEAP32[$126+4>>2]=HEAP32[$14+4>>2]|0;HEAP32[$126+8>>2]=HEAP32[$14+8>>2]|0;HEAP32[$126+12>>2]=HEAP32[$14+12>>2]|0;
 $i3 = 0;
 while(1) {
  $127 = $i3;
  $128 = $count;
  $129 = ($127|0)<($128|0);
  if (!($129)) {
   break;
  }
  $130 = $i3;
  $131 = $order;
  $132 = (($131) + ($130)|0);
  $133 = HEAP8[$132>>0]|0;
  $134 = $133&255;
  $j4 = $134;
  $135 = $j4;
  $136 = $unweighted;
  $137 = (($136) + (($135*12)|0)|0);
  $138 = (+__ZNK6squish4Vec31XEv($137));
  $139 = $j4;
  $140 = $unweighted;
  $141 = (($140) + (($139*12)|0)|0);
  $142 = (+__ZNK6squish4Vec31YEv($141));
  $143 = $j4;
  $144 = $unweighted;
  $145 = (($144) + (($143*12)|0)|0);
  $146 = (+__ZNK6squish4Vec31ZEv($145));
  __ZN6squish4Vec4C2Effff($p,$138,$142,$146,1.0);
  $147 = $j4;
  $148 = $weights;
  $149 = (($148) + ($147<<2)|0);
  $150 = +HEAPF32[$149>>2];
  __ZN6squish4Vec4C2Ef($w,$150);
  __ZN6squishmlERKNS_4Vec4ES2_($x,$p,$w);
  $151 = $i3;
  $152 = (($15) + 156|0);
  $153 = (($152) + ($151<<4)|0);
  ;HEAP32[$153+0>>2]=HEAP32[$x+0>>2]|0;HEAP32[$153+4>>2]=HEAP32[$x+4>>2]|0;HEAP32[$153+8>>2]=HEAP32[$x+8>>2]|0;HEAP32[$153+12>>2]=HEAP32[$x+12>>2]|0;
  $154 = (($15) + 412|0);
  (__ZN6squish4Vec4pLERKS0_($154,$x)|0);
  $155 = $i3;
  $156 = (($155) + 1)|0;
  $i3 = $156;
 }
 $$expand_i1_val2 = 1;
 $10 = $$expand_i1_val2;
 $$pre_trunc = $10;
 $157 = $$pre_trunc&1;
 STACKTOP = sp;return ($157|0);
}
function __ZN6squish10ClusterFit9Compress3EPv($this,$block) {
 $this = $this|0;
 $block = $block|0;
 var $0 = 0, $1 = 0, $10 = 0, $100 = 0, $101 = 0, $102 = 0, $103 = 0, $104 = 0, $105 = 0, $106 = 0, $107 = 0, $108 = 0, $109 = 0, $11 = 0, $110 = 0, $111 = 0, $112 = 0, $113 = 0, $114 = 0, $115 = 0;
 var $116 = 0, $117 = 0, $118 = 0, $119 = 0, $12 = 0, $120 = 0, $121 = 0, $122 = 0, $123 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $2 = 0, $20 = 0, $21 = 0, $22 = 0;
 var $23 = 0, $24 = 0, $25 = 0, $26 = 0, $27 = 0, $28 = 0, $29 = 0, $3 = 0, $30 = 0, $31 = 0, $32 = 0, $33 = 0, $34 = 0, $35 = 0, $36 = 0, $37 = 0, $38 = 0, $39 = 0, $4 = 0, $40 = 0;
 var $41 = 0, $42 = 0, $43 = 0, $44 = 0, $45 = 0, $46 = 0, $47 = 0, $48 = 0, $49 = 0, $5 = 0, $50 = 0, $51 = 0, $52 = 0, $53 = 0, $54 = 0, $55 = 0, $56 = 0, $57 = 0, $58 = 0, $59 = 0;
 var $6 = 0, $60 = 0, $61 = 0, $62 = 0, $63 = 0, $64 = 0, $65 = 0, $66 = 0, $67 = 0, $68 = 0, $69 = 0, $7 = 0, $70 = 0, $71 = 0, $72 = 0, $73 = 0, $74 = 0, $75 = 0, $76 = 0, $77 = 0;
 var $78 = 0, $79 = 0, $8 = 0, $80 = 0, $81 = 0, $82 = 0, $83 = 0, $84 = 0, $85 = 0, $86 = 0, $87 = 0, $88 = 0, $89 = 0, $9 = 0, $90 = 0, $91 = 0, $92 = 0, $93 = 0, $94 = 0, $95 = 0;
 var $96 = 0, $97 = 0, $98 = 0, $99 = 0, $a = 0, $alpha2_sum = 0, $alphabeta_sum = 0, $alphax_sum = 0, $axis = 0, $b = 0, $bestend = 0, $besterror = 0, $besti = 0, $bestindices = 0, $bestiteration = 0, $bestj = 0, $beststart = 0, $beta2_sum = 0, $betax_sum = 0, $count = 0;
 var $e1 = 0, $e2 = 0, $e3 = 0, $e4 = 0, $e5 = 0, $error = 0, $factor = 0, $grid = 0, $gridrcp = 0, $half = 0, $half_half2 = 0, $i = 0, $iterationIndex = 0, $j = 0, $jmin = 0, $m = 0, $m1 = 0, $m2 = 0, $one = 0, $order = 0;
 var $part0 = 0, $part1 = 0, $part2 = 0, $two = 0, $unordered = 0, $zero = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 1024|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $two = sp + 952|0;
 $one = sp + 936|0;
 $half_half2 = sp + 920|0;
 $zero = sp + 904|0;
 $half = sp + 888|0;
 $grid = sp + 872|0;
 $gridrcp = sp + 856|0;
 $beststart = sp + 840|0;
 $bestend = sp + 824|0;
 $besterror = sp + 808|0;
 $bestindices = sp + 1000|0;
 $part0 = sp + 776|0;
 $part1 = sp + 752|0;
 $part2 = sp + 728|0;
 $2 = sp + 712|0;
 $alphax_sum = sp + 696|0;
 $alpha2_sum = sp + 680|0;
 $betax_sum = sp + 664|0;
 $beta2_sum = sp + 648|0;
 $alphabeta_sum = sp + 632|0;
 $3 = sp + 616|0;
 $factor = sp + 600|0;
 $4 = sp + 584|0;
 $5 = sp + 568|0;
 $a = sp + 552|0;
 $6 = sp + 536|0;
 $7 = sp + 520|0;
 $b = sp + 504|0;
 $8 = sp + 488|0;
 $9 = sp + 472|0;
 $10 = sp + 456|0;
 $11 = sp + 440|0;
 $12 = sp + 424|0;
 $13 = sp + 408|0;
 $14 = sp + 392|0;
 $15 = sp + 376|0;
 $16 = sp + 360|0;
 $17 = sp + 344|0;
 $18 = sp + 328|0;
 $19 = sp + 312|0;
 $e1 = sp + 296|0;
 $20 = sp + 280|0;
 $21 = sp + 264|0;
 $22 = sp + 248|0;
 $e2 = sp + 232|0;
 $23 = sp + 216|0;
 $24 = sp + 200|0;
 $e3 = sp + 184|0;
 $e4 = sp + 168|0;
 $e5 = sp + 152|0;
 $error = sp + 136|0;
 $25 = sp + 120|0;
 $26 = sp + 104|0;
 $27 = sp + 88|0;
 $28 = sp + 72|0;
 $axis = sp + 56|0;
 $29 = sp + 40|0;
 $unordered = sp + 984|0;
 $30 = sp + 12|0;
 $31 = sp;
 $0 = $this;
 $1 = $block;
 $32 = $0;
 $33 = (($32) + 4|0);
 $34 = HEAP32[$33>>2]|0;
 $35 = (__ZNK6squish9ColourSet8GetCountEv($34)|0);
 $count = $35;
 __ZN6squish4Vec4C2Ef($two,2.0);
 __ZN6squish4Vec4C2Ef($one,1.0);
 __ZN6squish4Vec4C2Effff($half_half2,0.5,0.5,0.5,0.25);
 __ZN6squish4Vec4C2Ef($zero,0.0);
 __ZN6squish4Vec4C2Ef($half,0.5);
 __ZN6squish4Vec4C2Effff($grid,31.0,63.0,31.0,0.0);
 __ZN6squish4Vec4C2Effff($gridrcp,0.032258063554763794,0.01587301678955555,0.032258063554763794,0.0);
 $36 = (($32) + 16|0);
 (__ZN6squish10ClusterFit17ConstructOrderingERKNS_4Vec3Ei($32,$36,0)|0);
 __ZN6squish4Vec4C2Ef($beststart,0.0);
 __ZN6squish4Vec4C2Ef($bestend,0.0);
 $37 = (($32) + 444|0);
 ;HEAP32[$besterror+0>>2]=HEAP32[$37+0>>2]|0;HEAP32[$besterror+4>>2]=HEAP32[$37+4>>2]|0;HEAP32[$besterror+8>>2]=HEAP32[$37+8>>2]|0;HEAP32[$besterror+12>>2]=HEAP32[$37+12>>2]|0;
 $bestiteration = 0;
 $besti = 0;
 $bestj = 0;
 $iterationIndex = 0;
 while(1) {
  __ZN6squish4Vec4C2Ef($part0,0.0);
  $i = 0;
  while(1) {
   $38 = $i;
   $39 = $count;
   $40 = ($38|0)<($39|0);
   if (!($40)) {
    break;
   }
   $41 = $i;
   $42 = ($41|0)==(0);
   if ($42) {
    $43 = (($32) + 156|0);
    ;HEAP32[$part1+0>>2]=HEAP32[$43+0>>2]|0;HEAP32[$part1+4>>2]=HEAP32[$43+4>>2]|0;HEAP32[$part1+8>>2]=HEAP32[$43+8>>2]|0;HEAP32[$part1+12>>2]=HEAP32[$43+12>>2]|0;
   } else {
    __ZN6squish4Vec4C2Ef($part1,0.0);
   }
   $44 = $i;
   $45 = ($44|0)==(0);
   if ($45) {
    $47 = 1;
   } else {
    $46 = $i;
    $47 = $46;
   }
   $jmin = $47;
   $48 = $jmin;
   $j = $48;
   while(1) {
    $49 = (($32) + 412|0);
    __ZN6squishmiERKNS_4Vec4ES2_($2,$49,$part1);
    __ZN6squishmiERKNS_4Vec4ES2_($part2,$2,$part0);
    __ZN6squish11MultiplyAddERKNS_4Vec4ES2_S2_($alphax_sum,$part1,$half_half2,$part0);
    __ZNK6squish4Vec46SplatWEv($alpha2_sum,$alphax_sum);
    __ZN6squish11MultiplyAddERKNS_4Vec4ES2_S2_($betax_sum,$part1,$half_half2,$part2);
    __ZNK6squish4Vec46SplatWEv($beta2_sum,$betax_sum);
    __ZN6squishmlERKNS_4Vec4ES2_($3,$part1,$half_half2);
    __ZNK6squish4Vec46SplatWEv($alphabeta_sum,$3);
    __ZN6squishmlERKNS_4Vec4ES2_($5,$alpha2_sum,$beta2_sum);
    __ZN6squish24NegativeMultiplySubtractERKNS_4Vec4ES2_S2_($4,$alphabeta_sum,$alphabeta_sum,$5);
    __ZN6squish10ReciprocalERKNS_4Vec4E($factor,$4);
    __ZN6squishmlERKNS_4Vec4ES2_($7,$alphax_sum,$beta2_sum);
    __ZN6squish24NegativeMultiplySubtractERKNS_4Vec4ES2_S2_($6,$betax_sum,$alphabeta_sum,$7);
    __ZN6squishmlERKNS_4Vec4ES2_($a,$6,$factor);
    __ZN6squishmlERKNS_4Vec4ES2_($9,$betax_sum,$alpha2_sum);
    __ZN6squish24NegativeMultiplySubtractERKNS_4Vec4ES2_S2_($8,$alphax_sum,$alphabeta_sum,$9);
    __ZN6squishmlERKNS_4Vec4ES2_($b,$8,$factor);
    __ZN6squish3MaxERKNS_4Vec4ES2_($11,$zero,$a);
    __ZN6squish3MinERKNS_4Vec4ES2_($10,$one,$11);
    ;HEAP32[$a+0>>2]=HEAP32[$10+0>>2]|0;HEAP32[$a+4>>2]=HEAP32[$10+4>>2]|0;HEAP32[$a+8>>2]=HEAP32[$10+8>>2]|0;HEAP32[$a+12>>2]=HEAP32[$10+12>>2]|0;
    __ZN6squish3MaxERKNS_4Vec4ES2_($13,$zero,$b);
    __ZN6squish3MinERKNS_4Vec4ES2_($12,$one,$13);
    ;HEAP32[$b+0>>2]=HEAP32[$12+0>>2]|0;HEAP32[$b+4>>2]=HEAP32[$12+4>>2]|0;HEAP32[$b+8>>2]=HEAP32[$12+8>>2]|0;HEAP32[$b+12>>2]=HEAP32[$12+12>>2]|0;
    __ZN6squish11MultiplyAddERKNS_4Vec4ES2_S2_($16,$grid,$a,$half);
    __ZN6squish8TruncateERKNS_4Vec4E($15,$16);
    __ZN6squishmlERKNS_4Vec4ES2_($14,$15,$gridrcp);
    ;HEAP32[$a+0>>2]=HEAP32[$14+0>>2]|0;HEAP32[$a+4>>2]=HEAP32[$14+4>>2]|0;HEAP32[$a+8>>2]=HEAP32[$14+8>>2]|0;HEAP32[$a+12>>2]=HEAP32[$14+12>>2]|0;
    __ZN6squish11MultiplyAddERKNS_4Vec4ES2_S2_($19,$grid,$b,$half);
    __ZN6squish8TruncateERKNS_4Vec4E($18,$19);
    __ZN6squishmlERKNS_4Vec4ES2_($17,$18,$gridrcp);
    ;HEAP32[$b+0>>2]=HEAP32[$17+0>>2]|0;HEAP32[$b+4>>2]=HEAP32[$17+4>>2]|0;HEAP32[$b+8>>2]=HEAP32[$17+8>>2]|0;HEAP32[$b+12>>2]=HEAP32[$17+12>>2]|0;
    __ZN6squishmlERKNS_4Vec4ES2_($20,$a,$a);
    __ZN6squishmlERKNS_4Vec4ES2_($22,$b,$b);
    __ZN6squishmlERKNS_4Vec4ES2_($21,$22,$beta2_sum);
    __ZN6squish11MultiplyAddERKNS_4Vec4ES2_S2_($e1,$20,$alpha2_sum,$21);
    __ZN6squishmlERKNS_4Vec4ES2_($24,$a,$b);
    __ZN6squishmlERKNS_4Vec4ES2_($23,$24,$alphabeta_sum);
    __ZN6squish24NegativeMultiplySubtractERKNS_4Vec4ES2_S2_($e2,$a,$alphax_sum,$23);
    __ZN6squish24NegativeMultiplySubtractERKNS_4Vec4ES2_S2_($e3,$b,$betax_sum,$e2);
    __ZN6squish11MultiplyAddERKNS_4Vec4ES2_S2_($e4,$two,$e3,$e1);
    $50 = (($32) + 428|0);
    __ZN6squishmlERKNS_4Vec4ES2_($e5,$e4,$50);
    __ZNK6squish4Vec46SplatXEv($26,$e5);
    __ZNK6squish4Vec46SplatYEv($27,$e5);
    __ZN6squishplERKNS_4Vec4ES2_($25,$26,$27);
    __ZNK6squish4Vec46SplatZEv($28,$e5);
    __ZN6squishplERKNS_4Vec4ES2_($error,$25,$28);
    $51 = (__ZN6squish18CompareAnyLessThanERKNS_4Vec4ES2_($error,$besterror)|0);
    if ($51) {
     ;HEAP32[$beststart+0>>2]=HEAP32[$a+0>>2]|0;HEAP32[$beststart+4>>2]=HEAP32[$a+4>>2]|0;HEAP32[$beststart+8>>2]=HEAP32[$a+8>>2]|0;HEAP32[$beststart+12>>2]=HEAP32[$a+12>>2]|0;
     ;HEAP32[$bestend+0>>2]=HEAP32[$b+0>>2]|0;HEAP32[$bestend+4>>2]=HEAP32[$b+4>>2]|0;HEAP32[$bestend+8>>2]=HEAP32[$b+8>>2]|0;HEAP32[$bestend+12>>2]=HEAP32[$b+12>>2]|0;
     $52 = $i;
     $besti = $52;
     $53 = $j;
     $bestj = $53;
     ;HEAP32[$besterror+0>>2]=HEAP32[$error+0>>2]|0;HEAP32[$besterror+4>>2]=HEAP32[$error+4>>2]|0;HEAP32[$besterror+8>>2]=HEAP32[$error+8>>2]|0;HEAP32[$besterror+12>>2]=HEAP32[$error+12>>2]|0;
     $54 = $iterationIndex;
     $bestiteration = $54;
    }
    $55 = $j;
    $56 = $count;
    $57 = ($55|0)==($56|0);
    if ($57) {
     break;
    }
    $58 = $j;
    $59 = (($32) + 156|0);
    $60 = (($59) + ($58<<4)|0);
    (__ZN6squish4Vec4pLERKS0_($part1,$60)|0);
    $61 = $j;
    $62 = (($61) + 1)|0;
    $j = $62;
   }
   $63 = $i;
   $64 = (($32) + 156|0);
   $65 = (($64) + ($63<<4)|0);
   (__ZN6squish4Vec4pLERKS0_($part0,$65)|0);
   $66 = $i;
   $67 = (($66) + 1)|0;
   $i = $67;
  }
  $68 = $bestiteration;
  $69 = $iterationIndex;
  $70 = ($68|0)!=($69|0);
  if ($70) {
   label = 19;
   break;
  }
  $71 = $iterationIndex;
  $72 = (($71) + 1)|0;
  $iterationIndex = $72;
  $73 = $iterationIndex;
  $74 = (($32) + 12|0);
  $75 = HEAP32[$74>>2]|0;
  $76 = ($73|0)==($75|0);
  if ($76) {
   label = 21;
   break;
  }
  __ZN6squishmiERKNS_4Vec4ES2_($29,$bestend,$beststart);
  __ZNK6squish4Vec47GetVec3Ev($axis,$29);
  $77 = $iterationIndex;
  $78 = (__ZN6squish10ClusterFit17ConstructOrderingERKNS_4Vec3Ei($32,$axis,$77)|0);
  if (!($78)) {
   label = 23;
   break;
  }
 }
 if ((label|0) == 19) {
 }
 else if ((label|0) == 21) {
 }
 else if ((label|0) == 23) {
 }
 $79 = (($32) + 444|0);
 $80 = (__ZN6squish18CompareAnyLessThanERKNS_4Vec4ES2_($besterror,$79)|0);
 if (!($80)) {
  STACKTOP = sp;return;
 }
 $81 = (($32) + 28|0);
 $82 = $bestiteration;
 $83 = $82<<4;
 $84 = (($81) + ($83)|0);
 $order = $84;
 $m = 0;
 while(1) {
  $85 = $m;
  $86 = $besti;
  $87 = ($85|0)<($86|0);
  if (!($87)) {
   break;
  }
  $88 = $m;
  $89 = $order;
  $90 = (($89) + ($88)|0);
  $91 = HEAP8[$90>>0]|0;
  $92 = $91&255;
  $93 = (($unordered) + ($92)|0);
  HEAP8[$93>>0] = 0;
  $94 = $m;
  $95 = (($94) + 1)|0;
  $m = $95;
 }
 $96 = $besti;
 $m1 = $96;
 while(1) {
  $97 = $m1;
  $98 = $bestj;
  $99 = ($97|0)<($98|0);
  if (!($99)) {
   break;
  }
  $100 = $m1;
  $101 = $order;
  $102 = (($101) + ($100)|0);
  $103 = HEAP8[$102>>0]|0;
  $104 = $103&255;
  $105 = (($unordered) + ($104)|0);
  HEAP8[$105>>0] = 2;
  $106 = $m1;
  $107 = (($106) + 1)|0;
  $m1 = $107;
 }
 $108 = $bestj;
 $m2 = $108;
 while(1) {
  $109 = $m2;
  $110 = $count;
  $111 = ($109|0)<($110|0);
  if (!($111)) {
   break;
  }
  $112 = $m2;
  $113 = $order;
  $114 = (($113) + ($112)|0);
  $115 = HEAP8[$114>>0]|0;
  $116 = $115&255;
  $117 = (($unordered) + ($116)|0);
  HEAP8[$117>>0] = 1;
  $118 = $m2;
  $119 = (($118) + 1)|0;
  $m2 = $119;
 }
 $120 = (($32) + 4|0);
 $121 = HEAP32[$120>>2]|0;
 __ZNK6squish9ColourSet12RemapIndicesEPKhPh($121,$unordered,$bestindices);
 __ZNK6squish4Vec47GetVec3Ev($30,$beststart);
 __ZNK6squish4Vec47GetVec3Ev($31,$bestend);
 $122 = $1;
 __ZN6squish17WriteColourBlock3ERKNS_4Vec3ES2_PKhPv($30,$31,$bestindices,$122);
 $123 = (($32) + 444|0);
 ;HEAP32[$123+0>>2]=HEAP32[$besterror+0>>2]|0;HEAP32[$123+4>>2]=HEAP32[$besterror+4>>2]|0;HEAP32[$123+8>>2]=HEAP32[$besterror+8>>2]|0;HEAP32[$123+12>>2]=HEAP32[$besterror+12>>2]|0;
 STACKTOP = sp;return;
}
function __ZN6squish10ClusterFit9Compress4EPv($this,$block) {
 $this = $this|0;
 $block = $block|0;
 var $0 = 0, $1 = 0, $10 = 0, $100 = 0, $101 = 0, $102 = 0, $103 = 0, $104 = 0, $105 = 0, $106 = 0, $107 = 0, $108 = 0, $109 = 0, $11 = 0, $110 = 0, $111 = 0, $112 = 0, $113 = 0, $114 = 0, $115 = 0;
 var $116 = 0, $117 = 0, $118 = 0, $119 = 0, $12 = 0, $120 = 0, $121 = 0, $122 = 0, $123 = 0, $124 = 0, $125 = 0, $126 = 0, $127 = 0, $128 = 0, $129 = 0, $13 = 0, $130 = 0, $131 = 0, $132 = 0, $133 = 0;
 var $134 = 0, $135 = 0, $136 = 0, $137 = 0, $138 = 0, $139 = 0, $14 = 0, $140 = 0, $141 = 0, $142 = 0, $143 = 0, $144 = 0, $145 = 0, $146 = 0, $147 = 0, $148 = 0, $149 = 0, $15 = 0, $16 = 0, $17 = 0;
 var $18 = 0, $19 = 0, $2 = 0, $20 = 0, $21 = 0, $22 = 0, $23 = 0, $24 = 0, $25 = 0, $26 = 0, $27 = 0, $28 = 0, $29 = 0, $3 = 0, $30 = 0, $31 = 0, $32 = 0, $33 = 0, $34 = 0, $35 = 0;
 var $36 = 0, $37 = 0, $38 = 0, $39 = 0, $4 = 0, $40 = 0, $41 = 0, $42 = 0, $43 = 0, $44 = 0, $45 = 0, $46 = 0, $47 = 0, $48 = 0, $49 = 0, $5 = 0, $50 = 0, $51 = 0, $52 = 0, $53 = 0;
 var $54 = 0, $55 = 0, $56 = 0, $57 = 0, $58 = 0, $59 = 0, $6 = 0, $60 = 0, $61 = 0, $62 = 0, $63 = 0, $64 = 0, $65 = 0, $66 = 0, $67 = 0, $68 = 0, $69 = 0, $7 = 0, $70 = 0, $71 = 0;
 var $72 = 0, $73 = 0, $74 = 0, $75 = 0, $76 = 0, $77 = 0, $78 = 0, $79 = 0, $8 = 0, $80 = 0, $81 = 0, $82 = 0, $83 = 0, $84 = 0, $85 = 0, $86 = 0, $87 = 0, $88 = 0, $89 = 0, $9 = 0;
 var $90 = 0, $91 = 0, $92 = 0, $93 = 0, $94 = 0, $95 = 0, $96 = 0, $97 = 0, $98 = 0, $99 = 0, $a = 0, $alpha2_sum = 0, $alphabeta_sum = 0, $alphax_sum = 0, $axis = 0, $b = 0, $bestend = 0, $besterror = 0, $besti = 0, $bestindices = 0;
 var $bestiteration = 0, $bestj = 0, $bestk = 0, $beststart = 0, $beta2_sum = 0, $betax_sum = 0, $count = 0, $e1 = 0, $e2 = 0, $e3 = 0, $e4 = 0, $e5 = 0, $error = 0, $factor = 0, $grid = 0, $gridrcp = 0, $half = 0, $i = 0, $iterationIndex = 0, $j = 0;
 var $k = 0, $kmin = 0, $m = 0, $m1 = 0, $m2 = 0, $m3 = 0, $one = 0, $onethird_onethird2 = 0, $order = 0, $part0 = 0, $part1 = 0, $part2 = 0, $part3 = 0, $two = 0, $twonineths = 0, $twothirds_twothirds2 = 0, $unordered = 0, $zero = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 1152|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $two = sp + 1088|0;
 $one = sp + 1072|0;
 $onethird_onethird2 = sp + 1056|0;
 $twothirds_twothirds2 = sp + 1040|0;
 $twonineths = sp + 1024|0;
 $zero = sp + 1008|0;
 $half = sp + 992|0;
 $grid = sp + 976|0;
 $gridrcp = sp + 960|0;
 $beststart = sp + 944|0;
 $bestend = sp + 928|0;
 $besterror = sp + 912|0;
 $bestindices = sp + 1136|0;
 $part0 = sp + 872|0;
 $part1 = sp + 848|0;
 $part2 = sp + 824|0;
 $part3 = sp + 800|0;
 $2 = sp + 784|0;
 $3 = sp + 768|0;
 $alphax_sum = sp + 752|0;
 $4 = sp + 736|0;
 $alpha2_sum = sp + 720|0;
 $betax_sum = sp + 704|0;
 $5 = sp + 688|0;
 $beta2_sum = sp + 672|0;
 $alphabeta_sum = sp + 656|0;
 $6 = sp + 640|0;
 $7 = sp + 624|0;
 $factor = sp + 608|0;
 $8 = sp + 592|0;
 $9 = sp + 576|0;
 $a = sp + 560|0;
 $10 = sp + 544|0;
 $11 = sp + 528|0;
 $b = sp + 512|0;
 $12 = sp + 496|0;
 $13 = sp + 480|0;
 $14 = sp + 464|0;
 $15 = sp + 448|0;
 $16 = sp + 432|0;
 $17 = sp + 416|0;
 $18 = sp + 400|0;
 $19 = sp + 384|0;
 $20 = sp + 368|0;
 $21 = sp + 352|0;
 $22 = sp + 336|0;
 $23 = sp + 320|0;
 $e1 = sp + 304|0;
 $24 = sp + 288|0;
 $25 = sp + 272|0;
 $26 = sp + 256|0;
 $e2 = sp + 240|0;
 $27 = sp + 224|0;
 $28 = sp + 208|0;
 $e3 = sp + 192|0;
 $e4 = sp + 176|0;
 $e5 = sp + 160|0;
 $error = sp + 144|0;
 $29 = sp + 128|0;
 $30 = sp + 112|0;
 $31 = sp + 96|0;
 $32 = sp + 80|0;
 $axis = sp + 64|0;
 $33 = sp + 48|0;
 $unordered = sp + 1120|0;
 $34 = sp + 12|0;
 $35 = sp;
 $0 = $this;
 $1 = $block;
 $36 = $0;
 $37 = (($36) + 4|0);
 $38 = HEAP32[$37>>2]|0;
 $39 = (__ZNK6squish9ColourSet8GetCountEv($38)|0);
 $count = $39;
 __ZN6squish4Vec4C2Ef($two,2.0);
 __ZN6squish4Vec4C2Ef($one,1.0);
 __ZN6squish4Vec4C2Effff($onethird_onethird2,0.3333333432674408,0.3333333432674408,0.3333333432674408,0.1111111119389534);
 __ZN6squish4Vec4C2Effff($twothirds_twothirds2,0.66666668653488159,0.66666668653488159,0.66666668653488159,0.4444444477558136);
 __ZN6squish4Vec4C2Ef($twonineths,0.2222222238779068);
 __ZN6squish4Vec4C2Ef($zero,0.0);
 __ZN6squish4Vec4C2Ef($half,0.5);
 __ZN6squish4Vec4C2Effff($grid,31.0,63.0,31.0,0.0);
 __ZN6squish4Vec4C2Effff($gridrcp,0.032258063554763794,0.01587301678955555,0.032258063554763794,0.0);
 $40 = (($36) + 16|0);
 (__ZN6squish10ClusterFit17ConstructOrderingERKNS_4Vec3Ei($36,$40,0)|0);
 __ZN6squish4Vec4C2Ef($beststart,0.0);
 __ZN6squish4Vec4C2Ef($bestend,0.0);
 $41 = (($36) + 444|0);
 ;HEAP32[$besterror+0>>2]=HEAP32[$41+0>>2]|0;HEAP32[$besterror+4>>2]=HEAP32[$41+4>>2]|0;HEAP32[$besterror+8>>2]=HEAP32[$41+8>>2]|0;HEAP32[$besterror+12>>2]=HEAP32[$41+12>>2]|0;
 $bestiteration = 0;
 $besti = 0;
 $bestj = 0;
 $bestk = 0;
 $iterationIndex = 0;
 while(1) {
  __ZN6squish4Vec4C2Ef($part0,0.0);
  $i = 0;
  while(1) {
   $42 = $i;
   $43 = $count;
   $44 = ($42|0)<($43|0);
   if (!($44)) {
    break;
   }
   __ZN6squish4Vec4C2Ef($part1,0.0);
   $45 = $i;
   $j = $45;
   while(1) {
    $46 = $j;
    $47 = ($46|0)==(0);
    if ($47) {
     $48 = (($36) + 156|0);
     ;HEAP32[$part2+0>>2]=HEAP32[$48+0>>2]|0;HEAP32[$part2+4>>2]=HEAP32[$48+4>>2]|0;HEAP32[$part2+8>>2]=HEAP32[$48+8>>2]|0;HEAP32[$part2+12>>2]=HEAP32[$48+12>>2]|0;
    } else {
     __ZN6squish4Vec4C2Ef($part2,0.0);
    }
    $49 = $j;
    $50 = ($49|0)==(0);
    if ($50) {
     $52 = 1;
    } else {
     $51 = $j;
     $52 = $51;
    }
    $kmin = $52;
    $53 = $kmin;
    $k = $53;
    while(1) {
     $54 = (($36) + 412|0);
     __ZN6squishmiERKNS_4Vec4ES2_($3,$54,$part2);
     __ZN6squishmiERKNS_4Vec4ES2_($2,$3,$part1);
     __ZN6squishmiERKNS_4Vec4ES2_($part3,$2,$part0);
     __ZN6squish11MultiplyAddERKNS_4Vec4ES2_S2_($4,$part1,$twothirds_twothirds2,$part0);
     __ZN6squish11MultiplyAddERKNS_4Vec4ES2_S2_($alphax_sum,$part2,$onethird_onethird2,$4);
     __ZNK6squish4Vec46SplatWEv($alpha2_sum,$alphax_sum);
     __ZN6squish11MultiplyAddERKNS_4Vec4ES2_S2_($5,$part2,$twothirds_twothirds2,$part3);
     __ZN6squish11MultiplyAddERKNS_4Vec4ES2_S2_($betax_sum,$part1,$onethird_onethird2,$5);
     __ZNK6squish4Vec46SplatWEv($beta2_sum,$betax_sum);
     __ZN6squishplERKNS_4Vec4ES2_($7,$part1,$part2);
     __ZNK6squish4Vec46SplatWEv($6,$7);
     __ZN6squishmlERKNS_4Vec4ES2_($alphabeta_sum,$twonineths,$6);
     __ZN6squishmlERKNS_4Vec4ES2_($9,$alpha2_sum,$beta2_sum);
     __ZN6squish24NegativeMultiplySubtractERKNS_4Vec4ES2_S2_($8,$alphabeta_sum,$alphabeta_sum,$9);
     __ZN6squish10ReciprocalERKNS_4Vec4E($factor,$8);
     __ZN6squishmlERKNS_4Vec4ES2_($11,$alphax_sum,$beta2_sum);
     __ZN6squish24NegativeMultiplySubtractERKNS_4Vec4ES2_S2_($10,$betax_sum,$alphabeta_sum,$11);
     __ZN6squishmlERKNS_4Vec4ES2_($a,$10,$factor);
     __ZN6squishmlERKNS_4Vec4ES2_($13,$betax_sum,$alpha2_sum);
     __ZN6squish24NegativeMultiplySubtractERKNS_4Vec4ES2_S2_($12,$alphax_sum,$alphabeta_sum,$13);
     __ZN6squishmlERKNS_4Vec4ES2_($b,$12,$factor);
     __ZN6squish3MaxERKNS_4Vec4ES2_($15,$zero,$a);
     __ZN6squish3MinERKNS_4Vec4ES2_($14,$one,$15);
     ;HEAP32[$a+0>>2]=HEAP32[$14+0>>2]|0;HEAP32[$a+4>>2]=HEAP32[$14+4>>2]|0;HEAP32[$a+8>>2]=HEAP32[$14+8>>2]|0;HEAP32[$a+12>>2]=HEAP32[$14+12>>2]|0;
     __ZN6squish3MaxERKNS_4Vec4ES2_($17,$zero,$b);
     __ZN6squish3MinERKNS_4Vec4ES2_($16,$one,$17);
     ;HEAP32[$b+0>>2]=HEAP32[$16+0>>2]|0;HEAP32[$b+4>>2]=HEAP32[$16+4>>2]|0;HEAP32[$b+8>>2]=HEAP32[$16+8>>2]|0;HEAP32[$b+12>>2]=HEAP32[$16+12>>2]|0;
     __ZN6squish11MultiplyAddERKNS_4Vec4ES2_S2_($20,$grid,$a,$half);
     __ZN6squish8TruncateERKNS_4Vec4E($19,$20);
     __ZN6squishmlERKNS_4Vec4ES2_($18,$19,$gridrcp);
     ;HEAP32[$a+0>>2]=HEAP32[$18+0>>2]|0;HEAP32[$a+4>>2]=HEAP32[$18+4>>2]|0;HEAP32[$a+8>>2]=HEAP32[$18+8>>2]|0;HEAP32[$a+12>>2]=HEAP32[$18+12>>2]|0;
     __ZN6squish11MultiplyAddERKNS_4Vec4ES2_S2_($23,$grid,$b,$half);
     __ZN6squish8TruncateERKNS_4Vec4E($22,$23);
     __ZN6squishmlERKNS_4Vec4ES2_($21,$22,$gridrcp);
     ;HEAP32[$b+0>>2]=HEAP32[$21+0>>2]|0;HEAP32[$b+4>>2]=HEAP32[$21+4>>2]|0;HEAP32[$b+8>>2]=HEAP32[$21+8>>2]|0;HEAP32[$b+12>>2]=HEAP32[$21+12>>2]|0;
     __ZN6squishmlERKNS_4Vec4ES2_($24,$a,$a);
     __ZN6squishmlERKNS_4Vec4ES2_($26,$b,$b);
     __ZN6squishmlERKNS_4Vec4ES2_($25,$26,$beta2_sum);
     __ZN6squish11MultiplyAddERKNS_4Vec4ES2_S2_($e1,$24,$alpha2_sum,$25);
     __ZN6squishmlERKNS_4Vec4ES2_($28,$a,$b);
     __ZN6squishmlERKNS_4Vec4ES2_($27,$28,$alphabeta_sum);
     __ZN6squish24NegativeMultiplySubtractERKNS_4Vec4ES2_S2_($e2,$a,$alphax_sum,$27);
     __ZN6squish24NegativeMultiplySubtractERKNS_4Vec4ES2_S2_($e3,$b,$betax_sum,$e2);
     __ZN6squish11MultiplyAddERKNS_4Vec4ES2_S2_($e4,$two,$e3,$e1);
     $55 = (($36) + 428|0);
     __ZN6squishmlERKNS_4Vec4ES2_($e5,$e4,$55);
     __ZNK6squish4Vec46SplatXEv($30,$e5);
     __ZNK6squish4Vec46SplatYEv($31,$e5);
     __ZN6squishplERKNS_4Vec4ES2_($29,$30,$31);
     __ZNK6squish4Vec46SplatZEv($32,$e5);
     __ZN6squishplERKNS_4Vec4ES2_($error,$29,$32);
     $56 = (__ZN6squish18CompareAnyLessThanERKNS_4Vec4ES2_($error,$besterror)|0);
     if ($56) {
      ;HEAP32[$beststart+0>>2]=HEAP32[$a+0>>2]|0;HEAP32[$beststart+4>>2]=HEAP32[$a+4>>2]|0;HEAP32[$beststart+8>>2]=HEAP32[$a+8>>2]|0;HEAP32[$beststart+12>>2]=HEAP32[$a+12>>2]|0;
      ;HEAP32[$bestend+0>>2]=HEAP32[$b+0>>2]|0;HEAP32[$bestend+4>>2]=HEAP32[$b+4>>2]|0;HEAP32[$bestend+8>>2]=HEAP32[$b+8>>2]|0;HEAP32[$bestend+12>>2]=HEAP32[$b+12>>2]|0;
      ;HEAP32[$besterror+0>>2]=HEAP32[$error+0>>2]|0;HEAP32[$besterror+4>>2]=HEAP32[$error+4>>2]|0;HEAP32[$besterror+8>>2]=HEAP32[$error+8>>2]|0;HEAP32[$besterror+12>>2]=HEAP32[$error+12>>2]|0;
      $57 = $i;
      $besti = $57;
      $58 = $j;
      $bestj = $58;
      $59 = $k;
      $bestk = $59;
      $60 = $iterationIndex;
      $bestiteration = $60;
     }
     $61 = $k;
     $62 = $count;
     $63 = ($61|0)==($62|0);
     if ($63) {
      break;
     }
     $64 = $k;
     $65 = (($36) + 156|0);
     $66 = (($65) + ($64<<4)|0);
     (__ZN6squish4Vec4pLERKS0_($part2,$66)|0);
     $67 = $k;
     $68 = (($67) + 1)|0;
     $k = $68;
    }
    $69 = $j;
    $70 = $count;
    $71 = ($69|0)==($70|0);
    if ($71) {
     break;
    }
    $72 = $j;
    $73 = (($36) + 156|0);
    $74 = (($73) + ($72<<4)|0);
    (__ZN6squish4Vec4pLERKS0_($part1,$74)|0);
    $75 = $j;
    $76 = (($75) + 1)|0;
    $j = $76;
   }
   $77 = $i;
   $78 = (($36) + 156|0);
   $79 = (($78) + ($77<<4)|0);
   (__ZN6squish4Vec4pLERKS0_($part0,$79)|0);
   $80 = $i;
   $81 = (($80) + 1)|0;
   $i = $81;
  }
  $82 = $bestiteration;
  $83 = $iterationIndex;
  $84 = ($82|0)!=($83|0);
  if ($84) {
   label = 23;
   break;
  }
  $85 = $iterationIndex;
  $86 = (($85) + 1)|0;
  $iterationIndex = $86;
  $87 = $iterationIndex;
  $88 = (($36) + 12|0);
  $89 = HEAP32[$88>>2]|0;
  $90 = ($87|0)==($89|0);
  if ($90) {
   label = 25;
   break;
  }
  __ZN6squishmiERKNS_4Vec4ES2_($33,$bestend,$beststart);
  __ZNK6squish4Vec47GetVec3Ev($axis,$33);
  $91 = $iterationIndex;
  $92 = (__ZN6squish10ClusterFit17ConstructOrderingERKNS_4Vec3Ei($36,$axis,$91)|0);
  if (!($92)) {
   label = 27;
   break;
  }
 }
 if ((label|0) == 23) {
 }
 else if ((label|0) == 25) {
 }
 else if ((label|0) == 27) {
 }
 $93 = (($36) + 444|0);
 $94 = (__ZN6squish18CompareAnyLessThanERKNS_4Vec4ES2_($besterror,$93)|0);
 if (!($94)) {
  STACKTOP = sp;return;
 }
 $95 = (($36) + 28|0);
 $96 = $bestiteration;
 $97 = $96<<4;
 $98 = (($95) + ($97)|0);
 $order = $98;
 $m = 0;
 while(1) {
  $99 = $m;
  $100 = $besti;
  $101 = ($99|0)<($100|0);
  if (!($101)) {
   break;
  }
  $102 = $m;
  $103 = $order;
  $104 = (($103) + ($102)|0);
  $105 = HEAP8[$104>>0]|0;
  $106 = $105&255;
  $107 = (($unordered) + ($106)|0);
  HEAP8[$107>>0] = 0;
  $108 = $m;
  $109 = (($108) + 1)|0;
  $m = $109;
 }
 $110 = $besti;
 $m1 = $110;
 while(1) {
  $111 = $m1;
  $112 = $bestj;
  $113 = ($111|0)<($112|0);
  if (!($113)) {
   break;
  }
  $114 = $m1;
  $115 = $order;
  $116 = (($115) + ($114)|0);
  $117 = HEAP8[$116>>0]|0;
  $118 = $117&255;
  $119 = (($unordered) + ($118)|0);
  HEAP8[$119>>0] = 2;
  $120 = $m1;
  $121 = (($120) + 1)|0;
  $m1 = $121;
 }
 $122 = $bestj;
 $m2 = $122;
 while(1) {
  $123 = $m2;
  $124 = $bestk;
  $125 = ($123|0)<($124|0);
  if (!($125)) {
   break;
  }
  $126 = $m2;
  $127 = $order;
  $128 = (($127) + ($126)|0);
  $129 = HEAP8[$128>>0]|0;
  $130 = $129&255;
  $131 = (($unordered) + ($130)|0);
  HEAP8[$131>>0] = 3;
  $132 = $m2;
  $133 = (($132) + 1)|0;
  $m2 = $133;
 }
 $134 = $bestk;
 $m3 = $134;
 while(1) {
  $135 = $m3;
  $136 = $count;
  $137 = ($135|0)<($136|0);
  if (!($137)) {
   break;
  }
  $138 = $m3;
  $139 = $order;
  $140 = (($139) + ($138)|0);
  $141 = HEAP8[$140>>0]|0;
  $142 = $141&255;
  $143 = (($unordered) + ($142)|0);
  HEAP8[$143>>0] = 1;
  $144 = $m3;
  $145 = (($144) + 1)|0;
  $m3 = $145;
 }
 $146 = (($36) + 4|0);
 $147 = HEAP32[$146>>2]|0;
 __ZNK6squish9ColourSet12RemapIndicesEPKhPh($147,$unordered,$bestindices);
 __ZNK6squish4Vec47GetVec3Ev($34,$beststart);
 __ZNK6squish4Vec47GetVec3Ev($35,$bestend);
 $148 = $1;
 __ZN6squish17WriteColourBlock4ERKNS_4Vec3ES2_PKhPv($34,$35,$bestindices,$148);
 $149 = (($36) + 444|0);
 ;HEAP32[$149+0>>2]=HEAP32[$besterror+0>>2]|0;HEAP32[$149+4>>2]=HEAP32[$besterror+4>>2]|0;HEAP32[$149+8>>2]=HEAP32[$besterror+8>>2]|0;HEAP32[$149+12>>2]=HEAP32[$besterror+12>>2]|0;
 STACKTOP = sp;return;
}
function __ZN6squish4Vec3C2Ev($this) {
 $this = $this|0;
 var $0 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $0 = $this;
 STACKTOP = sp;return;
}
function __ZN6squish4Vec4C2Ev($this) {
 $this = $this|0;
 var $0 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $0 = $this;
 STACKTOP = sp;return;
}
function __ZN6squish4Vec4C2Ef($this,$s) {
 $this = $this|0;
 $s = +$s;
 var $0 = 0, $1 = 0.0, $2 = 0, $3 = 0.0, $4 = 0, $5 = 0.0, $6 = 0, $7 = 0.0, $8 = 0, $9 = 0.0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $0 = $this;
 $1 = $s;
 $2 = $0;
 $3 = $1;
 HEAPF32[$2>>2] = $3;
 $4 = (($2) + 4|0);
 $5 = $1;
 HEAPF32[$4>>2] = $5;
 $6 = (($2) + 8|0);
 $7 = $1;
 HEAPF32[$6>>2] = $7;
 $8 = (($2) + 12|0);
 $9 = $1;
 HEAPF32[$8>>2] = $9;
 STACKTOP = sp;return;
}
function __ZN6squish4Vec4C2Effff($this,$x,$y,$z,$w) {
 $this = $this|0;
 $x = +$x;
 $y = +$y;
 $z = +$z;
 $w = +$w;
 var $0 = 0, $1 = 0.0, $10 = 0.0, $11 = 0, $12 = 0.0, $2 = 0.0, $3 = 0.0, $4 = 0.0, $5 = 0, $6 = 0.0, $7 = 0, $8 = 0.0, $9 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 32|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $0 = $this;
 $1 = $x;
 $2 = $y;
 $3 = $z;
 $4 = $w;
 $5 = $0;
 $6 = $1;
 HEAPF32[$5>>2] = $6;
 $7 = (($5) + 4|0);
 $8 = $2;
 HEAPF32[$7>>2] = $8;
 $9 = (($5) + 8|0);
 $10 = $3;
 HEAPF32[$9>>2] = $10;
 $11 = (($5) + 12|0);
 $12 = $4;
 HEAPF32[$11>>2] = $12;
 STACKTOP = sp;return;
}
function __ZNK6squish9ColourSet8GetCountEv($this) {
 $this = $this|0;
 var $0 = 0, $1 = 0, $2 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $0 = $this;
 $1 = $0;
 $2 = HEAP32[$1>>2]|0;
 STACKTOP = sp;return ($2|0);
}
function __ZNK6squish9ColourSet9GetPointsEv($this) {
 $this = $this|0;
 var $0 = 0, $1 = 0, $2 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $0 = $this;
 $1 = $0;
 $2 = (($1) + 4|0);
 STACKTOP = sp;return ($2|0);
}
function __ZNK6squish9ColourSet10GetWeightsEv($this) {
 $this = $this|0;
 var $0 = 0, $1 = 0, $2 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $0 = $this;
 $1 = $0;
 $2 = (($1) + 196|0);
 STACKTOP = sp;return ($2|0);
}
function __ZN6squish3DotERKNS_4Vec3ES2_($left,$right) {
 $left = $left|0;
 $right = $right|0;
 var $0 = 0, $1 = 0, $10 = 0, $11 = 0, $12 = 0.0, $13 = 0.0, $14 = 0.0, $15 = 0, $16 = 0, $17 = 0.0, $18 = 0, $19 = 0, $2 = 0, $20 = 0.0, $21 = 0.0, $22 = 0.0, $3 = 0.0, $4 = 0, $5 = 0.0, $6 = 0.0;
 var $7 = 0, $8 = 0, $9 = 0.0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $0 = $left;
 $1 = $right;
 $2 = $0;
 $3 = +HEAPF32[$2>>2];
 $4 = $1;
 $5 = +HEAPF32[$4>>2];
 $6 = $3 * $5;
 $7 = $0;
 $8 = (($7) + 4|0);
 $9 = +HEAPF32[$8>>2];
 $10 = $1;
 $11 = (($10) + 4|0);
 $12 = +HEAPF32[$11>>2];
 $13 = $9 * $12;
 $14 = $6 + $13;
 $15 = $0;
 $16 = (($15) + 8|0);
 $17 = +HEAPF32[$16>>2];
 $18 = $1;
 $19 = (($18) + 8|0);
 $20 = +HEAPF32[$19>>2];
 $21 = $17 * $20;
 $22 = $14 + $21;
 STACKTOP = sp;return (+$22);
}
function __ZNK6squish4Vec31XEv($this) {
 $this = $this|0;
 var $0 = 0, $1 = 0, $2 = 0.0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $0 = $this;
 $1 = $0;
 $2 = +HEAPF32[$1>>2];
 STACKTOP = sp;return (+$2);
}
function __ZNK6squish4Vec31YEv($this) {
 $this = $this|0;
 var $0 = 0, $1 = 0, $2 = 0, $3 = 0.0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $0 = $this;
 $1 = $0;
 $2 = (($1) + 4|0);
 $3 = +HEAPF32[$2>>2];
 STACKTOP = sp;return (+$3);
}
function __ZNK6squish4Vec31ZEv($this) {
 $this = $this|0;
 var $0 = 0, $1 = 0, $2 = 0, $3 = 0.0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $0 = $this;
 $1 = $0;
 $2 = (($1) + 8|0);
 $3 = +HEAPF32[$2>>2];
 STACKTOP = sp;return (+$3);
}
function __ZN6squishmlERKNS_4Vec4ES2_($agg$result,$left,$right) {
 $agg$result = $agg$result|0;
 $left = $left|0;
 $right = $right|0;
 var $0 = 0, $1 = 0, $2 = 0, $3 = 0, $4 = 0, $copy = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 32|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $copy = sp;
 $0 = $left;
 $1 = $right;
 $2 = $0;
 ;HEAP32[$copy+0>>2]=HEAP32[$2+0>>2]|0;HEAP32[$copy+4>>2]=HEAP32[$2+4>>2]|0;HEAP32[$copy+8>>2]=HEAP32[$2+8>>2]|0;HEAP32[$copy+12>>2]=HEAP32[$2+12>>2]|0;
 $3 = $1;
 $4 = (__ZN6squish4Vec4mLERKS0_($copy,$3)|0);
 ;HEAP32[$agg$result+0>>2]=HEAP32[$4+0>>2]|0;HEAP32[$agg$result+4>>2]=HEAP32[$4+4>>2]|0;HEAP32[$agg$result+8>>2]=HEAP32[$4+8>>2]|0;HEAP32[$agg$result+12>>2]=HEAP32[$4+12>>2]|0;
 STACKTOP = sp;return;
}
function __ZN6squish4Vec4pLERKS0_($this,$v) {
 $this = $this|0;
 $v = $v|0;
 var $0 = 0, $1 = 0, $10 = 0, $11 = 0.0, $12 = 0.0, $13 = 0, $14 = 0, $15 = 0.0, $16 = 0, $17 = 0.0, $18 = 0.0, $19 = 0, $2 = 0, $20 = 0, $21 = 0.0, $22 = 0, $23 = 0.0, $24 = 0.0, $3 = 0, $4 = 0.0;
 var $5 = 0.0, $6 = 0.0, $7 = 0, $8 = 0, $9 = 0.0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $0 = $this;
 $1 = $v;
 $2 = $0;
 $3 = $1;
 $4 = +HEAPF32[$3>>2];
 $5 = +HEAPF32[$2>>2];
 $6 = $5 + $4;
 HEAPF32[$2>>2] = $6;
 $7 = $1;
 $8 = (($7) + 4|0);
 $9 = +HEAPF32[$8>>2];
 $10 = (($2) + 4|0);
 $11 = +HEAPF32[$10>>2];
 $12 = $11 + $9;
 HEAPF32[$10>>2] = $12;
 $13 = $1;
 $14 = (($13) + 8|0);
 $15 = +HEAPF32[$14>>2];
 $16 = (($2) + 8|0);
 $17 = +HEAPF32[$16>>2];
 $18 = $17 + $15;
 HEAPF32[$16>>2] = $18;
 $19 = $1;
 $20 = (($19) + 12|0);
 $21 = +HEAPF32[$20>>2];
 $22 = (($2) + 12|0);
 $23 = +HEAPF32[$22>>2];
 $24 = $23 + $21;
 HEAPF32[$22>>2] = $24;
 STACKTOP = sp;return ($2|0);
}
function __ZN6squishmiERKNS_4Vec4ES2_($agg$result,$left,$right) {
 $agg$result = $agg$result|0;
 $left = $left|0;
 $right = $right|0;
 var $0 = 0, $1 = 0, $2 = 0, $3 = 0, $4 = 0, $copy = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 32|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $copy = sp;
 $0 = $left;
 $1 = $right;
 $2 = $0;
 ;HEAP32[$copy+0>>2]=HEAP32[$2+0>>2]|0;HEAP32[$copy+4>>2]=HEAP32[$2+4>>2]|0;HEAP32[$copy+8>>2]=HEAP32[$2+8>>2]|0;HEAP32[$copy+12>>2]=HEAP32[$2+12>>2]|0;
 $3 = $1;
 $4 = (__ZN6squish4Vec4mIERKS0_($copy,$3)|0);
 ;HEAP32[$agg$result+0>>2]=HEAP32[$4+0>>2]|0;HEAP32[$agg$result+4>>2]=HEAP32[$4+4>>2]|0;HEAP32[$agg$result+8>>2]=HEAP32[$4+8>>2]|0;HEAP32[$agg$result+12>>2]=HEAP32[$4+12>>2]|0;
 STACKTOP = sp;return;
}
function __ZN6squish11MultiplyAddERKNS_4Vec4ES2_S2_($agg$result,$a,$b,$c) {
 $agg$result = $agg$result|0;
 $a = $a|0;
 $b = $b|0;
 $c = $c|0;
 var $0 = 0, $1 = 0, $2 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 32|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $3 = sp;
 $0 = $a;
 $1 = $b;
 $2 = $c;
 $4 = $0;
 $5 = $1;
 __ZN6squishmlERKNS_4Vec4ES2_($3,$4,$5);
 $6 = $2;
 __ZN6squishplERKNS_4Vec4ES2_($agg$result,$3,$6);
 STACKTOP = sp;return;
}
function __ZNK6squish4Vec46SplatWEv($agg$result,$this) {
 $agg$result = $agg$result|0;
 $this = $this|0;
 var $0 = 0, $1 = 0, $2 = 0, $3 = 0.0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $0 = $this;
 $1 = $0;
 $2 = (($1) + 12|0);
 $3 = +HEAPF32[$2>>2];
 __ZN6squish4Vec4C2Ef($agg$result,$3);
 STACKTOP = sp;return;
}
function __ZN6squish24NegativeMultiplySubtractERKNS_4Vec4ES2_S2_($agg$result,$a,$b,$c) {
 $agg$result = $agg$result|0;
 $a = $a|0;
 $b = $b|0;
 $c = $c|0;
 var $0 = 0, $1 = 0, $2 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 32|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $3 = sp;
 $0 = $a;
 $1 = $b;
 $2 = $c;
 $4 = $2;
 $5 = $0;
 $6 = $1;
 __ZN6squishmlERKNS_4Vec4ES2_($3,$5,$6);
 __ZN6squishmiERKNS_4Vec4ES2_($agg$result,$4,$3);
 STACKTOP = sp;return;
}
function __ZN6squish10ReciprocalERKNS_4Vec4E($agg$result,$v) {
 $agg$result = $agg$result|0;
 $v = $v|0;
 var $0 = 0, $1 = 0, $10 = 0.0, $11 = 0.0, $12 = 0, $13 = 0, $14 = 0.0, $15 = 0.0, $2 = 0.0, $3 = 0.0, $4 = 0, $5 = 0, $6 = 0.0, $7 = 0.0, $8 = 0, $9 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $0 = $v;
 $1 = $0;
 $2 = +HEAPF32[$1>>2];
 $3 = 1.0 / $2;
 $4 = $0;
 $5 = (($4) + 4|0);
 $6 = +HEAPF32[$5>>2];
 $7 = 1.0 / $6;
 $8 = $0;
 $9 = (($8) + 8|0);
 $10 = +HEAPF32[$9>>2];
 $11 = 1.0 / $10;
 $12 = $0;
 $13 = (($12) + 12|0);
 $14 = +HEAPF32[$13>>2];
 $15 = 1.0 / $14;
 __ZN6squish4Vec4C2Effff($agg$result,$3,$7,$11,$15);
 STACKTOP = sp;return;
}
function __ZN6squish3MaxERKNS_4Vec4ES2_($agg$result,$left,$right) {
 $agg$result = $agg$result|0;
 $left = $left|0;
 $right = $right|0;
 var $0 = 0, $1 = 0, $10 = 0, $100 = 0, $101 = 0, $102 = 0.0, $103 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $2 = 0, $20 = 0, $21 = 0, $22 = 0;
 var $23 = 0, $24 = 0, $25 = 0, $26 = 0, $27 = 0, $28 = 0, $29 = 0, $3 = 0, $30 = 0, $31 = 0, $32 = 0, $33 = 0, $34 = 0, $35 = 0, $36 = 0, $37 = 0, $38 = 0, $39 = 0, $4 = 0, $40 = 0;
 var $41 = 0, $42 = 0, $43 = 0, $44 = 0, $45 = 0.0, $46 = 0, $47 = 0.0, $48 = 0, $49 = 0, $5 = 0, $50 = 0, $51 = 0.0, $52 = 0, $53 = 0, $54 = 0, $55 = 0, $56 = 0, $57 = 0, $58 = 0, $59 = 0;
 var $6 = 0, $60 = 0, $61 = 0, $62 = 0.0, $63 = 0, $64 = 0.0, $65 = 0, $66 = 0, $67 = 0, $68 = 0.0, $69 = 0, $7 = 0, $70 = 0, $71 = 0, $72 = 0, $73 = 0, $74 = 0, $75 = 0, $76 = 0, $77 = 0;
 var $78 = 0, $79 = 0.0, $8 = 0, $80 = 0, $81 = 0.0, $82 = 0, $83 = 0, $84 = 0, $85 = 0.0, $86 = 0, $87 = 0, $88 = 0, $89 = 0, $9 = 0, $90 = 0, $91 = 0, $92 = 0, $93 = 0, $94 = 0, $95 = 0;
 var $96 = 0.0, $97 = 0, $98 = 0.0, $99 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 160|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $5 = sp + 24|0;
 $8 = sp + 151|0;
 $14 = sp + 16|0;
 $17 = sp + 150|0;
 $23 = sp + 8|0;
 $26 = sp + 149|0;
 $32 = sp;
 $35 = sp + 148|0;
 $36 = $left;
 $37 = $right;
 $38 = $36;
 $39 = $37;
 $33 = $38;
 $34 = $39;
 $40 = $33;
 $41 = $34;
 ;HEAP8[$32+0>>0]=HEAP8[$35+0>>0]|0;
 $30 = $40;
 $31 = $41;
 $42 = $30;
 $43 = $31;
 $27 = $32;
 $28 = $42;
 $29 = $43;
 $44 = $28;
 $45 = +HEAPF32[$44>>2];
 $46 = $29;
 $47 = +HEAPF32[$46>>2];
 $48 = $45 < $47;
 if ($48) {
  $49 = $31;
  $52 = $49;
 } else {
  $50 = $30;
  $52 = $50;
 }
 $51 = +HEAPF32[$52>>2];
 $53 = $36;
 $54 = (($53) + 4|0);
 $55 = $37;
 $56 = (($55) + 4|0);
 $24 = $54;
 $25 = $56;
 $57 = $24;
 $58 = $25;
 ;HEAP8[$23+0>>0]=HEAP8[$26+0>>0]|0;
 $21 = $57;
 $22 = $58;
 $59 = $21;
 $60 = $22;
 $18 = $23;
 $19 = $59;
 $20 = $60;
 $61 = $19;
 $62 = +HEAPF32[$61>>2];
 $63 = $20;
 $64 = +HEAPF32[$63>>2];
 $65 = $62 < $64;
 if ($65) {
  $66 = $22;
  $69 = $66;
 } else {
  $67 = $21;
  $69 = $67;
 }
 $68 = +HEAPF32[$69>>2];
 $70 = $36;
 $71 = (($70) + 8|0);
 $72 = $37;
 $73 = (($72) + 8|0);
 $6 = $71;
 $7 = $73;
 $74 = $6;
 $75 = $7;
 ;HEAP8[$5+0>>0]=HEAP8[$8+0>>0]|0;
 $3 = $74;
 $4 = $75;
 $76 = $3;
 $77 = $4;
 $0 = $5;
 $1 = $76;
 $2 = $77;
 $78 = $1;
 $79 = +HEAPF32[$78>>2];
 $80 = $2;
 $81 = +HEAPF32[$80>>2];
 $82 = $79 < $81;
 if ($82) {
  $83 = $4;
  $86 = $83;
 } else {
  $84 = $3;
  $86 = $84;
 }
 $85 = +HEAPF32[$86>>2];
 $87 = $36;
 $88 = (($87) + 12|0);
 $89 = $37;
 $90 = (($89) + 12|0);
 $15 = $88;
 $16 = $90;
 $91 = $15;
 $92 = $16;
 ;HEAP8[$14+0>>0]=HEAP8[$17+0>>0]|0;
 $12 = $91;
 $13 = $92;
 $93 = $12;
 $94 = $13;
 $9 = $14;
 $10 = $93;
 $11 = $94;
 $95 = $10;
 $96 = +HEAPF32[$95>>2];
 $97 = $11;
 $98 = +HEAPF32[$97>>2];
 $99 = $96 < $98;
 if ($99) {
  $100 = $13;
  $103 = $100;
  $102 = +HEAPF32[$103>>2];
  __ZN6squish4Vec4C2Effff($agg$result,$51,$68,$85,$102);
  STACKTOP = sp;return;
 } else {
  $101 = $12;
  $103 = $101;
  $102 = +HEAPF32[$103>>2];
  __ZN6squish4Vec4C2Effff($agg$result,$51,$68,$85,$102);
  STACKTOP = sp;return;
 }
}
function __ZN6squish3MinERKNS_4Vec4ES2_($agg$result,$left,$right) {
 $agg$result = $agg$result|0;
 $left = $left|0;
 $right = $right|0;
 var $0 = 0, $1 = 0, $10 = 0, $100 = 0, $101 = 0, $102 = 0.0, $103 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $2 = 0, $20 = 0, $21 = 0, $22 = 0;
 var $23 = 0, $24 = 0, $25 = 0, $26 = 0, $27 = 0, $28 = 0, $29 = 0, $3 = 0, $30 = 0, $31 = 0, $32 = 0, $33 = 0, $34 = 0, $35 = 0, $36 = 0, $37 = 0, $38 = 0, $39 = 0, $4 = 0, $40 = 0;
 var $41 = 0, $42 = 0, $43 = 0, $44 = 0, $45 = 0.0, $46 = 0, $47 = 0.0, $48 = 0, $49 = 0, $5 = 0, $50 = 0, $51 = 0.0, $52 = 0, $53 = 0, $54 = 0, $55 = 0, $56 = 0, $57 = 0, $58 = 0, $59 = 0;
 var $6 = 0, $60 = 0, $61 = 0, $62 = 0.0, $63 = 0, $64 = 0.0, $65 = 0, $66 = 0, $67 = 0, $68 = 0.0, $69 = 0, $7 = 0, $70 = 0, $71 = 0, $72 = 0, $73 = 0, $74 = 0, $75 = 0, $76 = 0, $77 = 0;
 var $78 = 0, $79 = 0.0, $8 = 0, $80 = 0, $81 = 0.0, $82 = 0, $83 = 0, $84 = 0, $85 = 0.0, $86 = 0, $87 = 0, $88 = 0, $89 = 0, $9 = 0, $90 = 0, $91 = 0, $92 = 0, $93 = 0, $94 = 0, $95 = 0;
 var $96 = 0.0, $97 = 0, $98 = 0.0, $99 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 160|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $5 = sp + 24|0;
 $8 = sp + 151|0;
 $14 = sp + 16|0;
 $17 = sp + 150|0;
 $23 = sp + 8|0;
 $26 = sp + 149|0;
 $32 = sp;
 $35 = sp + 148|0;
 $36 = $left;
 $37 = $right;
 $38 = $36;
 $39 = $37;
 $33 = $38;
 $34 = $39;
 $40 = $33;
 $41 = $34;
 ;HEAP8[$32+0>>0]=HEAP8[$35+0>>0]|0;
 $30 = $40;
 $31 = $41;
 $42 = $31;
 $43 = $30;
 $27 = $32;
 $28 = $42;
 $29 = $43;
 $44 = $28;
 $45 = +HEAPF32[$44>>2];
 $46 = $29;
 $47 = +HEAPF32[$46>>2];
 $48 = $45 < $47;
 if ($48) {
  $49 = $31;
  $52 = $49;
 } else {
  $50 = $30;
  $52 = $50;
 }
 $51 = +HEAPF32[$52>>2];
 $53 = $36;
 $54 = (($53) + 4|0);
 $55 = $37;
 $56 = (($55) + 4|0);
 $24 = $54;
 $25 = $56;
 $57 = $24;
 $58 = $25;
 ;HEAP8[$23+0>>0]=HEAP8[$26+0>>0]|0;
 $21 = $57;
 $22 = $58;
 $59 = $22;
 $60 = $21;
 $18 = $23;
 $19 = $59;
 $20 = $60;
 $61 = $19;
 $62 = +HEAPF32[$61>>2];
 $63 = $20;
 $64 = +HEAPF32[$63>>2];
 $65 = $62 < $64;
 if ($65) {
  $66 = $22;
  $69 = $66;
 } else {
  $67 = $21;
  $69 = $67;
 }
 $68 = +HEAPF32[$69>>2];
 $70 = $36;
 $71 = (($70) + 8|0);
 $72 = $37;
 $73 = (($72) + 8|0);
 $6 = $71;
 $7 = $73;
 $74 = $6;
 $75 = $7;
 ;HEAP8[$5+0>>0]=HEAP8[$8+0>>0]|0;
 $3 = $74;
 $4 = $75;
 $76 = $4;
 $77 = $3;
 $0 = $5;
 $1 = $76;
 $2 = $77;
 $78 = $1;
 $79 = +HEAPF32[$78>>2];
 $80 = $2;
 $81 = +HEAPF32[$80>>2];
 $82 = $79 < $81;
 if ($82) {
  $83 = $4;
  $86 = $83;
 } else {
  $84 = $3;
  $86 = $84;
 }
 $85 = +HEAPF32[$86>>2];
 $87 = $36;
 $88 = (($87) + 12|0);
 $89 = $37;
 $90 = (($89) + 12|0);
 $15 = $88;
 $16 = $90;
 $91 = $15;
 $92 = $16;
 ;HEAP8[$14+0>>0]=HEAP8[$17+0>>0]|0;
 $12 = $91;
 $13 = $92;
 $93 = $13;
 $94 = $12;
 $9 = $14;
 $10 = $93;
 $11 = $94;
 $95 = $10;
 $96 = +HEAPF32[$95>>2];
 $97 = $11;
 $98 = +HEAPF32[$97>>2];
 $99 = $96 < $98;
 if ($99) {
  $100 = $13;
  $103 = $100;
  $102 = +HEAPF32[$103>>2];
  __ZN6squish4Vec4C2Effff($agg$result,$51,$68,$85,$102);
  STACKTOP = sp;return;
 } else {
  $101 = $12;
  $103 = $101;
  $102 = +HEAPF32[$103>>2];
  __ZN6squish4Vec4C2Effff($agg$result,$51,$68,$85,$102);
  STACKTOP = sp;return;
 }
}
function __ZN6squish8TruncateERKNS_4Vec4E($agg$result,$v) {
 $agg$result = $agg$result|0;
 $v = $v|0;
 var $0 = 0.0, $1 = 0.0, $10 = 0.0, $11 = 0, $12 = 0, $13 = 0.0, $14 = 0.0, $15 = 0.0, $16 = 0, $17 = 0.0, $18 = 0.0, $19 = 0.0, $2 = 0.0, $20 = 0, $21 = 0, $22 = 0.0, $23 = 0, $24 = 0, $25 = 0, $26 = 0.0;
 var $27 = 0.0, $28 = 0.0, $29 = 0, $3 = 0.0, $30 = 0, $31 = 0.0, $32 = 0.0, $33 = 0.0, $34 = 0, $35 = 0, $36 = 0.0, $37 = 0, $38 = 0, $39 = 0, $4 = 0.0, $40 = 0.0, $41 = 0.0, $42 = 0.0, $43 = 0, $44 = 0;
 var $45 = 0.0, $46 = 0.0, $47 = 0.0, $48 = 0, $49 = 0, $5 = 0.0, $50 = 0.0, $51 = 0, $52 = 0, $53 = 0, $54 = 0.0, $55 = 0.0, $56 = 0.0, $57 = 0, $58 = 0, $59 = 0.0, $6 = 0.0, $60 = 0.0, $61 = 0.0, $62 = 0.0;
 var $63 = 0.0, $64 = 0.0, $65 = 0.0, $7 = 0.0, $8 = 0, $9 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 48|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $8 = $v;
 $9 = $8;
 $10 = +HEAPF32[$9>>2];
 $11 = $10 > 0.0;
 if ($11) {
  $12 = $8;
  $13 = +HEAPF32[$12>>2];
  $7 = $13;
  $14 = $7;
  $15 = (+Math_floor((+$14)));
  $62 = $15;
 } else {
  $16 = $8;
  $17 = +HEAPF32[$16>>2];
  $6 = $17;
  $18 = $6;
  $19 = (+Math_ceil((+$18)));
  $62 = $19;
 }
 $20 = $8;
 $21 = (($20) + 4|0);
 $22 = +HEAPF32[$21>>2];
 $23 = $22 > 0.0;
 if ($23) {
  $24 = $8;
  $25 = (($24) + 4|0);
  $26 = +HEAPF32[$25>>2];
  $5 = $26;
  $27 = $5;
  $28 = (+Math_floor((+$27)));
  $63 = $28;
 } else {
  $29 = $8;
  $30 = (($29) + 4|0);
  $31 = +HEAPF32[$30>>2];
  $4 = $31;
  $32 = $4;
  $33 = (+Math_ceil((+$32)));
  $63 = $33;
 }
 $34 = $8;
 $35 = (($34) + 8|0);
 $36 = +HEAPF32[$35>>2];
 $37 = $36 > 0.0;
 if ($37) {
  $38 = $8;
  $39 = (($38) + 8|0);
  $40 = +HEAPF32[$39>>2];
  $3 = $40;
  $41 = $3;
  $42 = (+Math_floor((+$41)));
  $64 = $42;
 } else {
  $43 = $8;
  $44 = (($43) + 8|0);
  $45 = +HEAPF32[$44>>2];
  $2 = $45;
  $46 = $2;
  $47 = (+Math_ceil((+$46)));
  $64 = $47;
 }
 $48 = $8;
 $49 = (($48) + 12|0);
 $50 = +HEAPF32[$49>>2];
 $51 = $50 > 0.0;
 if ($51) {
  $52 = $8;
  $53 = (($52) + 12|0);
  $54 = +HEAPF32[$53>>2];
  $1 = $54;
  $55 = $1;
  $56 = (+Math_floor((+$55)));
  $65 = $56;
  __ZN6squish4Vec4C2Effff($agg$result,$62,$63,$64,$65);
  STACKTOP = sp;return;
 } else {
  $57 = $8;
  $58 = (($57) + 12|0);
  $59 = +HEAPF32[$58>>2];
  $0 = $59;
  $60 = $0;
  $61 = (+Math_ceil((+$60)));
  $65 = $61;
  __ZN6squish4Vec4C2Effff($agg$result,$62,$63,$64,$65);
  STACKTOP = sp;return;
 }
}
function __ZNK6squish4Vec46SplatXEv($agg$result,$this) {
 $agg$result = $agg$result|0;
 $this = $this|0;
 var $0 = 0, $1 = 0, $2 = 0.0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $0 = $this;
 $1 = $0;
 $2 = +HEAPF32[$1>>2];
 __ZN6squish4Vec4C2Ef($agg$result,$2);
 STACKTOP = sp;return;
}
function __ZNK6squish4Vec46SplatYEv($agg$result,$this) {
 $agg$result = $agg$result|0;
 $this = $this|0;
 var $0 = 0, $1 = 0, $2 = 0, $3 = 0.0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $0 = $this;
 $1 = $0;
 $2 = (($1) + 4|0);
 $3 = +HEAPF32[$2>>2];
 __ZN6squish4Vec4C2Ef($agg$result,$3);
 STACKTOP = sp;return;
}
function __ZN6squishplERKNS_4Vec4ES2_($agg$result,$left,$right) {
 $agg$result = $agg$result|0;
 $left = $left|0;
 $right = $right|0;
 var $0 = 0, $1 = 0, $2 = 0, $3 = 0, $4 = 0, $copy = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 32|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $copy = sp;
 $0 = $left;
 $1 = $right;
 $2 = $0;
 ;HEAP32[$copy+0>>2]=HEAP32[$2+0>>2]|0;HEAP32[$copy+4>>2]=HEAP32[$2+4>>2]|0;HEAP32[$copy+8>>2]=HEAP32[$2+8>>2]|0;HEAP32[$copy+12>>2]=HEAP32[$2+12>>2]|0;
 $3 = $1;
 $4 = (__ZN6squish4Vec4pLERKS0_($copy,$3)|0);
 ;HEAP32[$agg$result+0>>2]=HEAP32[$4+0>>2]|0;HEAP32[$agg$result+4>>2]=HEAP32[$4+4>>2]|0;HEAP32[$agg$result+8>>2]=HEAP32[$4+8>>2]|0;HEAP32[$agg$result+12>>2]=HEAP32[$4+12>>2]|0;
 STACKTOP = sp;return;
}
function __ZNK6squish4Vec46SplatZEv($agg$result,$this) {
 $agg$result = $agg$result|0;
 $this = $this|0;
 var $0 = 0, $1 = 0, $2 = 0, $3 = 0.0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $0 = $this;
 $1 = $0;
 $2 = (($1) + 8|0);
 $3 = +HEAPF32[$2>>2];
 __ZN6squish4Vec4C2Ef($agg$result,$3);
 STACKTOP = sp;return;
}
function __ZN6squish18CompareAnyLessThanERKNS_4Vec4ES2_($left,$right) {
 $left = $left|0;
 $right = $right|0;
 var $0 = 0, $1 = 0, $10 = 0, $11 = 0, $12 = 0.0, $13 = 0, $14 = 0, $15 = 0, $16 = 0.0, $17 = 0, $18 = 0, $19 = 0.0, $2 = 0, $20 = 0, $21 = 0, $22 = 0, $23 = 0.0, $24 = 0, $25 = 0, $26 = 0.0;
 var $27 = 0, $28 = 0, $3 = 0.0, $4 = 0, $5 = 0.0, $6 = 0, $7 = 0, $8 = 0, $9 = 0.0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $0 = $left;
 $1 = $right;
 $2 = $0;
 $3 = +HEAPF32[$2>>2];
 $4 = $1;
 $5 = +HEAPF32[$4>>2];
 $6 = $3 < $5;
 if ($6) {
  $28 = 1;
  STACKTOP = sp;return ($28|0);
 }
 $7 = $0;
 $8 = (($7) + 4|0);
 $9 = +HEAPF32[$8>>2];
 $10 = $1;
 $11 = (($10) + 4|0);
 $12 = +HEAPF32[$11>>2];
 $13 = $9 < $12;
 if ($13) {
  $28 = 1;
  STACKTOP = sp;return ($28|0);
 }
 $14 = $0;
 $15 = (($14) + 8|0);
 $16 = +HEAPF32[$15>>2];
 $17 = $1;
 $18 = (($17) + 8|0);
 $19 = +HEAPF32[$18>>2];
 $20 = $16 < $19;
 if ($20) {
  $28 = 1;
  STACKTOP = sp;return ($28|0);
 }
 $21 = $0;
 $22 = (($21) + 12|0);
 $23 = +HEAPF32[$22>>2];
 $24 = $1;
 $25 = (($24) + 12|0);
 $26 = +HEAPF32[$25>>2];
 $27 = $23 < $26;
 $28 = $27;
 STACKTOP = sp;return ($28|0);
}
function __ZNK6squish4Vec47GetVec3Ev($agg$result,$this) {
 $agg$result = $agg$result|0;
 $this = $this|0;
 var $0 = 0, $1 = 0, $2 = 0.0, $3 = 0, $4 = 0.0, $5 = 0, $6 = 0.0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $0 = $this;
 $1 = $0;
 $2 = +HEAPF32[$1>>2];
 $3 = (($1) + 4|0);
 $4 = +HEAPF32[$3>>2];
 $5 = (($1) + 8|0);
 $6 = +HEAPF32[$5>>2];
 __ZN6squish4Vec3C2Efff($agg$result,$2,$4,$6);
 STACKTOP = sp;return;
}
function __ZN6squish4Vec4mLERKS0_($this,$v) {
 $this = $this|0;
 $v = $v|0;
 var $0 = 0, $1 = 0, $10 = 0, $11 = 0.0, $12 = 0.0, $13 = 0, $14 = 0, $15 = 0.0, $16 = 0, $17 = 0.0, $18 = 0.0, $19 = 0, $2 = 0, $20 = 0, $21 = 0.0, $22 = 0, $23 = 0.0, $24 = 0.0, $3 = 0, $4 = 0.0;
 var $5 = 0.0, $6 = 0.0, $7 = 0, $8 = 0, $9 = 0.0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $0 = $this;
 $1 = $v;
 $2 = $0;
 $3 = $1;
 $4 = +HEAPF32[$3>>2];
 $5 = +HEAPF32[$2>>2];
 $6 = $5 * $4;
 HEAPF32[$2>>2] = $6;
 $7 = $1;
 $8 = (($7) + 4|0);
 $9 = +HEAPF32[$8>>2];
 $10 = (($2) + 4|0);
 $11 = +HEAPF32[$10>>2];
 $12 = $11 * $9;
 HEAPF32[$10>>2] = $12;
 $13 = $1;
 $14 = (($13) + 8|0);
 $15 = +HEAPF32[$14>>2];
 $16 = (($2) + 8|0);
 $17 = +HEAPF32[$16>>2];
 $18 = $17 * $15;
 HEAPF32[$16>>2] = $18;
 $19 = $1;
 $20 = (($19) + 12|0);
 $21 = +HEAPF32[$20>>2];
 $22 = (($2) + 12|0);
 $23 = +HEAPF32[$22>>2];
 $24 = $23 * $21;
 HEAPF32[$22>>2] = $24;
 STACKTOP = sp;return ($2|0);
}
function __ZN6squish4Vec4mIERKS0_($this,$v) {
 $this = $this|0;
 $v = $v|0;
 var $0 = 0, $1 = 0, $10 = 0, $11 = 0.0, $12 = 0.0, $13 = 0, $14 = 0, $15 = 0.0, $16 = 0, $17 = 0.0, $18 = 0.0, $19 = 0, $2 = 0, $20 = 0, $21 = 0.0, $22 = 0, $23 = 0.0, $24 = 0.0, $3 = 0, $4 = 0.0;
 var $5 = 0.0, $6 = 0.0, $7 = 0, $8 = 0, $9 = 0.0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $0 = $this;
 $1 = $v;
 $2 = $0;
 $3 = $1;
 $4 = +HEAPF32[$3>>2];
 $5 = +HEAPF32[$2>>2];
 $6 = $5 - $4;
 HEAPF32[$2>>2] = $6;
 $7 = $1;
 $8 = (($7) + 4|0);
 $9 = +HEAPF32[$8>>2];
 $10 = (($2) + 4|0);
 $11 = +HEAPF32[$10>>2];
 $12 = $11 - $9;
 HEAPF32[$10>>2] = $12;
 $13 = $1;
 $14 = (($13) + 8|0);
 $15 = +HEAPF32[$14>>2];
 $16 = (($2) + 8|0);
 $17 = +HEAPF32[$16>>2];
 $18 = $17 - $15;
 HEAPF32[$16>>2] = $18;
 $19 = $1;
 $20 = (($19) + 12|0);
 $21 = +HEAPF32[$20>>2];
 $22 = (($2) + 12|0);
 $23 = +HEAPF32[$22>>2];
 $24 = $23 - $21;
 HEAPF32[$22>>2] = $24;
 STACKTOP = sp;return ($2|0);
}
function __ZN6squish4Vec3C2Efff($this,$x,$y,$z) {
 $this = $this|0;
 $x = +$x;
 $y = +$y;
 $z = +$z;
 var $0 = 0, $1 = 0.0, $2 = 0.0, $3 = 0.0, $4 = 0, $5 = 0.0, $6 = 0.0, $7 = 0, $8 = 0.0, $9 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $0 = $this;
 $1 = $x;
 $2 = $y;
 $3 = $z;
 $4 = $0;
 $5 = $1;
 HEAPF32[$4>>2] = $5;
 $6 = $2;
 $7 = (($4) + 4|0);
 HEAPF32[$7>>2] = $6;
 $8 = $3;
 $9 = (($4) + 8|0);
 HEAPF32[$9>>2] = $8;
 STACKTOP = sp;return;
}
function __ZN6squish17WriteColourBlock3ERKNS_4Vec3ES2_PKhPv($start,$end,$indices,$block) {
 $start = $start|0;
 $end = $end|0;
 $indices = $indices|0;
 $block = $block|0;
 var $0 = 0, $1 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $2 = 0, $20 = 0, $21 = 0, $22 = 0, $23 = 0, $24 = 0, $25 = 0, $26 = 0;
 var $27 = 0, $28 = 0, $29 = 0, $3 = 0, $30 = 0, $31 = 0, $32 = 0, $33 = 0, $34 = 0, $35 = 0, $36 = 0, $37 = 0, $38 = 0, $39 = 0, $4 = 0, $40 = 0, $41 = 0, $42 = 0, $43 = 0, $44 = 0;
 var $45 = 0, $46 = 0, $47 = 0, $48 = 0, $49 = 0, $5 = 0, $50 = 0, $51 = 0, $52 = 0, $53 = 0, $54 = 0, $55 = 0, $56 = 0, $57 = 0, $58 = 0, $59 = 0, $6 = 0, $60 = 0, $61 = 0, $62 = 0;
 var $63 = 0, $64 = 0, $7 = 0, $8 = 0, $9 = 0, $__t$i = 0, $a = 0, $b = 0, $i = 0, $i1 = 0, $remapped = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 80|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $__t$i = sp + 32|0;
 $a = sp + 12|0;
 $b = sp + 8|0;
 $remapped = sp + 56|0;
 $5 = $start;
 $6 = $end;
 $7 = $indices;
 $8 = $block;
 $9 = $5;
 $10 = (__ZN6squishL10FloatTo565ERKNS_4Vec3E($9)|0);
 HEAP32[$a>>2] = $10;
 $11 = $6;
 $12 = (__ZN6squishL10FloatTo565ERKNS_4Vec3E($11)|0);
 HEAP32[$b>>2] = $12;
 $13 = HEAP32[$a>>2]|0;
 $14 = HEAP32[$b>>2]|0;
 $15 = ($13|0)<=($14|0);
 if ($15) {
  $i = 0;
  while(1) {
   $16 = $i;
   $17 = ($16|0)<(16);
   if (!($17)) {
    break;
   }
   $18 = $i;
   $19 = $7;
   $20 = (($19) + ($18)|0);
   $21 = HEAP8[$20>>0]|0;
   $22 = $i;
   $23 = (($remapped) + ($22)|0);
   HEAP8[$23>>0] = $21;
   $24 = $i;
   $25 = (($24) + 1)|0;
   $i = $25;
  }
  $62 = HEAP32[$a>>2]|0;
  $63 = HEAP32[$b>>2]|0;
  $64 = $8;
  __ZN6squishL16WriteColourBlockEiiPhPv($62,$63,$remapped,$64);
  STACKTOP = sp;return;
 }
 $3 = $a;
 $4 = $b;
 $26 = $3;
 $2 = $26;
 $27 = $2;
 $28 = HEAP32[$27>>2]|0;
 HEAP32[$__t$i>>2] = $28;
 $29 = $4;
 $0 = $29;
 $30 = $0;
 $31 = HEAP32[$30>>2]|0;
 $32 = $3;
 HEAP32[$32>>2] = $31;
 $1 = $__t$i;
 $33 = $1;
 $34 = HEAP32[$33>>2]|0;
 $35 = $4;
 HEAP32[$35>>2] = $34;
 $i1 = 0;
 while(1) {
  $36 = $i1;
  $37 = ($36|0)<(16);
  if (!($37)) {
   break;
  }
  $38 = $i1;
  $39 = $7;
  $40 = (($39) + ($38)|0);
  $41 = HEAP8[$40>>0]|0;
  $42 = $41&255;
  $43 = ($42|0)==(0);
  if ($43) {
   $44 = $i1;
   $45 = (($remapped) + ($44)|0);
   HEAP8[$45>>0] = 1;
  } else {
   $46 = $i1;
   $47 = $7;
   $48 = (($47) + ($46)|0);
   $49 = HEAP8[$48>>0]|0;
   $50 = $49&255;
   $51 = ($50|0)==(1);
   if ($51) {
    $52 = $i1;
    $53 = (($remapped) + ($52)|0);
    HEAP8[$53>>0] = 0;
   } else {
    $54 = $i1;
    $55 = $7;
    $56 = (($55) + ($54)|0);
    $57 = HEAP8[$56>>0]|0;
    $58 = $i1;
    $59 = (($remapped) + ($58)|0);
    HEAP8[$59>>0] = $57;
   }
  }
  $60 = $i1;
  $61 = (($60) + 1)|0;
  $i1 = $61;
 }
 $62 = HEAP32[$a>>2]|0;
 $63 = HEAP32[$b>>2]|0;
 $64 = $8;
 __ZN6squishL16WriteColourBlockEiiPhPv($62,$63,$remapped,$64);
 STACKTOP = sp;return;
}
function __ZN6squish17WriteColourBlock4ERKNS_4Vec3ES2_PKhPv($start,$end,$indices,$block) {
 $start = $start|0;
 $end = $end|0;
 $indices = $indices|0;
 $block = $block|0;
 var $0 = 0, $1 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $2 = 0, $20 = 0, $21 = 0, $22 = 0, $23 = 0, $24 = 0, $25 = 0, $26 = 0;
 var $27 = 0, $28 = 0, $29 = 0, $3 = 0, $30 = 0, $31 = 0, $32 = 0, $33 = 0, $34 = 0, $35 = 0, $36 = 0, $37 = 0, $38 = 0, $39 = 0, $4 = 0, $40 = 0, $41 = 0, $42 = 0, $43 = 0, $44 = 0;
 var $45 = 0, $46 = 0, $47 = 0, $48 = 0, $49 = 0, $5 = 0, $50 = 0, $51 = 0, $52 = 0, $53 = 0, $54 = 0, $55 = 0, $56 = 0, $57 = 0, $58 = 0, $59 = 0, $6 = 0, $60 = 0, $61 = 0, $7 = 0;
 var $8 = 0, $9 = 0, $__t$i = 0, $a = 0, $b = 0, $i = 0, $i1 = 0, $i2 = 0, $remapped = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 80|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $__t$i = sp + 36|0;
 $a = sp + 16|0;
 $b = sp + 12|0;
 $remapped = sp + 64|0;
 $5 = $start;
 $6 = $end;
 $7 = $indices;
 $8 = $block;
 $9 = $5;
 $10 = (__ZN6squishL10FloatTo565ERKNS_4Vec3E($9)|0);
 HEAP32[$a>>2] = $10;
 $11 = $6;
 $12 = (__ZN6squishL10FloatTo565ERKNS_4Vec3E($11)|0);
 HEAP32[$b>>2] = $12;
 $13 = HEAP32[$a>>2]|0;
 $14 = HEAP32[$b>>2]|0;
 $15 = ($13|0)<($14|0);
 if ($15) {
  $3 = $a;
  $4 = $b;
  $16 = $3;
  $2 = $16;
  $17 = $2;
  $18 = HEAP32[$17>>2]|0;
  HEAP32[$__t$i>>2] = $18;
  $19 = $4;
  $0 = $19;
  $20 = $0;
  $21 = HEAP32[$20>>2]|0;
  $22 = $3;
  HEAP32[$22>>2] = $21;
  $1 = $__t$i;
  $23 = $1;
  $24 = HEAP32[$23>>2]|0;
  $25 = $4;
  HEAP32[$25>>2] = $24;
  $i = 0;
  while(1) {
   $26 = $i;
   $27 = ($26|0)<(16);
   if (!($27)) {
    break;
   }
   $28 = $i;
   $29 = $7;
   $30 = (($29) + ($28)|0);
   $31 = HEAP8[$30>>0]|0;
   $32 = $31&255;
   $33 = $32 ^ 1;
   $34 = $33 & 3;
   $35 = $34&255;
   $36 = $i;
   $37 = (($remapped) + ($36)|0);
   HEAP8[$37>>0] = $35;
   $38 = $i;
   $39 = (($38) + 1)|0;
   $i = $39;
  }
  $59 = HEAP32[$a>>2]|0;
  $60 = HEAP32[$b>>2]|0;
  $61 = $8;
  __ZN6squishL16WriteColourBlockEiiPhPv($59,$60,$remapped,$61);
  STACKTOP = sp;return;
 }
 $40 = HEAP32[$a>>2]|0;
 $41 = HEAP32[$b>>2]|0;
 $42 = ($40|0)==($41|0);
 if ($42) {
  $i1 = 0;
  while(1) {
   $43 = $i1;
   $44 = ($43|0)<(16);
   if (!($44)) {
    break;
   }
   $45 = $i1;
   $46 = (($remapped) + ($45)|0);
   HEAP8[$46>>0] = 0;
   $47 = $i1;
   $48 = (($47) + 1)|0;
   $i1 = $48;
  }
 } else {
  $i2 = 0;
  while(1) {
   $49 = $i2;
   $50 = ($49|0)<(16);
   if (!($50)) {
    break;
   }
   $51 = $i2;
   $52 = $7;
   $53 = (($52) + ($51)|0);
   $54 = HEAP8[$53>>0]|0;
   $55 = $i2;
   $56 = (($remapped) + ($55)|0);
   HEAP8[$56>>0] = $54;
   $57 = $i2;
   $58 = (($57) + 1)|0;
   $i2 = $58;
  }
 }
 $59 = HEAP32[$a>>2]|0;
 $60 = HEAP32[$b>>2]|0;
 $61 = $8;
 __ZN6squishL16WriteColourBlockEiiPhPv($59,$60,$remapped,$61);
 STACKTOP = sp;return;
}
function __ZN6squish16DecompressColourEPhPKvb($rgba,$block,$isDxt1) {
 $rgba = $rgba|0;
 $block = $block|0;
 $isDxt1 = $isDxt1|0;
 var $0 = 0, $1 = 0, $10 = 0, $100 = 0, $101 = 0, $102 = 0, $103 = 0, $104 = 0, $105 = 0, $106 = 0, $107 = 0, $108 = 0, $109 = 0, $11 = 0, $110 = 0, $111 = 0, $112 = 0, $113 = 0, $114 = 0, $115 = 0;
 var $116 = 0, $117 = 0, $118 = 0, $119 = 0, $12 = 0, $120 = 0, $121 = 0, $122 = 0, $123 = 0, $124 = 0, $125 = 0, $126 = 0, $127 = 0, $128 = 0, $129 = 0, $13 = 0, $130 = 0, $131 = 0, $14 = 0, $15 = 0;
 var $16 = 0, $17 = 0, $18 = 0, $19 = 0, $2 = 0, $20 = 0, $21 = 0, $22 = 0, $23 = 0, $24 = 0, $25 = 0, $26 = 0, $27 = 0, $28 = 0, $29 = 0, $3 = 0, $30 = 0, $31 = 0, $32 = 0, $33 = 0;
 var $34 = 0, $35 = 0, $36 = 0, $37 = 0, $38 = 0, $39 = 0, $4 = 0, $40 = 0, $41 = 0, $42 = 0, $43 = 0, $44 = 0, $45 = 0, $46 = 0, $47 = 0, $48 = 0, $49 = 0, $5 = 0, $50 = 0, $51 = 0;
 var $52 = 0, $53 = 0, $54 = 0, $55 = 0, $56 = 0, $57 = 0, $58 = 0, $59 = 0, $6 = 0, $60 = 0, $61 = 0, $62 = 0, $63 = 0, $64 = 0, $65 = 0, $66 = 0, $67 = 0, $68 = 0, $69 = 0, $7 = 0;
 var $70 = 0, $71 = 0, $72 = 0, $73 = 0, $74 = 0, $75 = 0, $76 = 0, $77 = 0, $78 = 0, $79 = 0, $8 = 0, $80 = 0, $81 = 0, $82 = 0, $83 = 0, $84 = 0, $85 = 0, $86 = 0, $87 = 0, $88 = 0;
 var $89 = 0, $9 = 0, $90 = 0, $91 = 0, $92 = 0, $93 = 0, $94 = 0, $95 = 0, $96 = 0, $97 = 0, $98 = 0, $99 = 0, $a = 0, $b = 0, $bytes = 0, $c = 0, $codes = 0, $d = 0, $i = 0, $i1 = 0;
 var $i2 = 0, $ind = 0, $indices = 0, $j = 0, $offset = 0, $packed = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 96|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $codes = sp + 72|0;
 $indices = sp + 56|0;
 $0 = $rgba;
 $1 = $block;
 $3 = $isDxt1&1;
 $2 = $3;
 $4 = $1;
 $bytes = $4;
 $5 = $bytes;
 $6 = (__ZN6squishL9Unpack565EPKhPh($5,$codes)|0);
 $a = $6;
 $7 = $bytes;
 $8 = (($7) + 2|0);
 $9 = (($codes) + 4|0);
 $10 = (__ZN6squishL9Unpack565EPKhPh($8,$9)|0);
 $b = $10;
 $i = 0;
 while(1) {
  $11 = $i;
  $12 = ($11|0)<(3);
  if (!($12)) {
   break;
  }
  $13 = $i;
  $14 = (($codes) + ($13)|0);
  $15 = HEAP8[$14>>0]|0;
  $16 = $15&255;
  $c = $16;
  $17 = $i;
  $18 = (4 + ($17))|0;
  $19 = (($codes) + ($18)|0);
  $20 = HEAP8[$19>>0]|0;
  $21 = $20&255;
  $d = $21;
  $22 = $2;
  $23 = $22&1;
  if ($23) {
   $24 = $a;
   $25 = $b;
   $26 = ($24|0)<=($25|0);
   if ($26) {
    $27 = $c;
    $28 = $d;
    $29 = (($27) + ($28))|0;
    $30 = (($29|0) / 2)&-1;
    $31 = $30&255;
    $32 = $i;
    $33 = (8 + ($32))|0;
    $34 = (($codes) + ($33)|0);
    HEAP8[$34>>0] = $31;
    $35 = $i;
    $36 = (12 + ($35))|0;
    $37 = (($codes) + ($36)|0);
    HEAP8[$37>>0] = 0;
   } else {
    label = 6;
   }
  } else {
   label = 6;
  }
  if ((label|0) == 6) {
   label = 0;
   $38 = $c;
   $39 = $38<<1;
   $40 = $d;
   $41 = (($39) + ($40))|0;
   $42 = (($41|0) / 3)&-1;
   $43 = $42&255;
   $44 = $i;
   $45 = (8 + ($44))|0;
   $46 = (($codes) + ($45)|0);
   HEAP8[$46>>0] = $43;
   $47 = $c;
   $48 = $d;
   $49 = $48<<1;
   $50 = (($47) + ($49))|0;
   $51 = (($50|0) / 3)&-1;
   $52 = $51&255;
   $53 = $i;
   $54 = (12 + ($53))|0;
   $55 = (($codes) + ($54)|0);
   HEAP8[$55>>0] = $52;
  }
  $56 = $i;
  $57 = (($56) + 1)|0;
  $i = $57;
 }
 $58 = (($codes) + 11|0);
 HEAP8[$58>>0] = -1;
 $59 = $2;
 $60 = $59&1;
 if ($60) {
  $61 = $a;
  $62 = $b;
  $63 = ($61|0)<=($62|0);
  $64 = $63;
 } else {
  $64 = 0;
 }
 $65 = $64 ? 0 : 255;
 $66 = $65&255;
 $67 = (($codes) + 15|0);
 HEAP8[$67>>0] = $66;
 $i1 = 0;
 while(1) {
  $68 = $i1;
  $69 = ($68|0)<(4);
  if (!($69)) {
   break;
  }
  $70 = $i1;
  $71 = $70<<2;
  $72 = (($indices) + ($71)|0);
  $ind = $72;
  $73 = $i1;
  $74 = (4 + ($73))|0;
  $75 = $bytes;
  $76 = (($75) + ($74)|0);
  $77 = HEAP8[$76>>0]|0;
  $packed = $77;
  $78 = $packed;
  $79 = $78&255;
  $80 = $79 & 3;
  $81 = $80&255;
  $82 = $ind;
  HEAP8[$82>>0] = $81;
  $83 = $packed;
  $84 = $83&255;
  $85 = $84 >> 2;
  $86 = $85 & 3;
  $87 = $86&255;
  $88 = $ind;
  $89 = (($88) + 1|0);
  HEAP8[$89>>0] = $87;
  $90 = $packed;
  $91 = $90&255;
  $92 = $91 >> 4;
  $93 = $92 & 3;
  $94 = $93&255;
  $95 = $ind;
  $96 = (($95) + 2|0);
  HEAP8[$96>>0] = $94;
  $97 = $packed;
  $98 = $97&255;
  $99 = $98 >> 6;
  $100 = $99 & 3;
  $101 = $100&255;
  $102 = $ind;
  $103 = (($102) + 3|0);
  HEAP8[$103>>0] = $101;
  $104 = $i1;
  $105 = (($104) + 1)|0;
  $i1 = $105;
 }
 $i2 = 0;
 while(1) {
  $106 = $i2;
  $107 = ($106|0)<(16);
  if (!($107)) {
   break;
  }
  $108 = $i2;
  $109 = (($indices) + ($108)|0);
  $110 = HEAP8[$109>>0]|0;
  $111 = $110&255;
  $112 = $111<<2;
  $113 = $112&255;
  $offset = $113;
  $j = 0;
  while(1) {
   $114 = $j;
   $115 = ($114|0)<(4);
   if (!($115)) {
    break;
   }
   $116 = $offset;
   $117 = $116&255;
   $118 = $j;
   $119 = (($117) + ($118))|0;
   $120 = (($codes) + ($119)|0);
   $121 = HEAP8[$120>>0]|0;
   $122 = $i2;
   $123 = $122<<2;
   $124 = $j;
   $125 = (($123) + ($124))|0;
   $126 = $0;
   $127 = (($126) + ($125)|0);
   HEAP8[$127>>0] = $121;
   $128 = $j;
   $129 = (($128) + 1)|0;
   $j = $129;
  }
  $130 = $i2;
  $131 = (($130) + 1)|0;
  $i2 = $131;
 }
 STACKTOP = sp;return;
}
function __ZN6squishL10FloatTo565ERKNS_4Vec3E($colour) {
 $colour = $colour|0;
 var $0 = 0, $1 = 0, $10 = 0.0, $11 = 0.0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $2 = 0.0, $3 = 0.0, $4 = 0, $5 = 0, $6 = 0.0, $7 = 0.0, $8 = 0, $9 = 0;
 var $b = 0, $g = 0, $r = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $0 = $colour;
 $1 = $0;
 $2 = (+__ZNK6squish4Vec31XEv($1));
 $3 = 31.0 * $2;
 $4 = (__ZN6squishL10FloatToIntEfi5($3,31)|0);
 $r = $4;
 $5 = $0;
 $6 = (+__ZNK6squish4Vec31YEv($5));
 $7 = 63.0 * $6;
 $8 = (__ZN6squishL10FloatToIntEfi5($7,63)|0);
 $g = $8;
 $9 = $0;
 $10 = (+__ZNK6squish4Vec31ZEv($9));
 $11 = 31.0 * $10;
 $12 = (__ZN6squishL10FloatToIntEfi5($11,31)|0);
 $b = $12;
 $13 = $r;
 $14 = $13 << 11;
 $15 = $g;
 $16 = $15 << 5;
 $17 = $14 | $16;
 $18 = $b;
 $19 = $17 | $18;
 STACKTOP = sp;return ($19|0);
}
function __ZN6squishL16WriteColourBlockEiiPhPv($a,$b,$indices,$block) {
 $a = $a|0;
 $b = $b|0;
 $indices = $indices|0;
 $block = $block|0;
 var $0 = 0, $1 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $2 = 0, $20 = 0, $21 = 0, $22 = 0, $23 = 0, $24 = 0, $25 = 0, $26 = 0;
 var $27 = 0, $28 = 0, $29 = 0, $3 = 0, $30 = 0, $31 = 0, $32 = 0, $33 = 0, $34 = 0, $35 = 0, $36 = 0, $37 = 0, $38 = 0, $39 = 0, $4 = 0, $40 = 0, $41 = 0, $42 = 0, $43 = 0, $44 = 0;
 var $45 = 0, $46 = 0, $47 = 0, $48 = 0, $49 = 0, $5 = 0, $50 = 0, $51 = 0, $52 = 0, $53 = 0, $54 = 0, $55 = 0, $56 = 0, $57 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, $bytes = 0, $i = 0;
 var $ind = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 32|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $0 = $a;
 $1 = $b;
 $2 = $indices;
 $3 = $block;
 $4 = $3;
 $bytes = $4;
 $5 = $0;
 $6 = $5 & 255;
 $7 = $6&255;
 $8 = $bytes;
 HEAP8[$8>>0] = $7;
 $9 = $0;
 $10 = $9 >> 8;
 $11 = $10&255;
 $12 = $bytes;
 $13 = (($12) + 1|0);
 HEAP8[$13>>0] = $11;
 $14 = $1;
 $15 = $14 & 255;
 $16 = $15&255;
 $17 = $bytes;
 $18 = (($17) + 2|0);
 HEAP8[$18>>0] = $16;
 $19 = $1;
 $20 = $19 >> 8;
 $21 = $20&255;
 $22 = $bytes;
 $23 = (($22) + 3|0);
 HEAP8[$23>>0] = $21;
 $i = 0;
 while(1) {
  $24 = $i;
  $25 = ($24|0)<(4);
  if (!($25)) {
   break;
  }
  $26 = $2;
  $27 = $i;
  $28 = $27<<2;
  $29 = (($26) + ($28)|0);
  $ind = $29;
  $30 = $ind;
  $31 = HEAP8[$30>>0]|0;
  $32 = $31&255;
  $33 = $ind;
  $34 = (($33) + 1|0);
  $35 = HEAP8[$34>>0]|0;
  $36 = $35&255;
  $37 = $36 << 2;
  $38 = $32 | $37;
  $39 = $ind;
  $40 = (($39) + 2|0);
  $41 = HEAP8[$40>>0]|0;
  $42 = $41&255;
  $43 = $42 << 4;
  $44 = $38 | $43;
  $45 = $ind;
  $46 = (($45) + 3|0);
  $47 = HEAP8[$46>>0]|0;
  $48 = $47&255;
  $49 = $48 << 6;
  $50 = $44 | $49;
  $51 = $50&255;
  $52 = $i;
  $53 = (4 + ($52))|0;
  $54 = $bytes;
  $55 = (($54) + ($53)|0);
  HEAP8[$55>>0] = $51;
  $56 = $i;
  $57 = (($56) + 1)|0;
  $i = $57;
 }
 STACKTOP = sp;return;
}
function __ZN6squishL9Unpack565EPKhPh($packed,$colour) {
 $packed = $packed|0;
 $colour = $colour|0;
 var $0 = 0, $1 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $2 = 0, $20 = 0, $21 = 0, $22 = 0, $23 = 0, $24 = 0, $25 = 0, $26 = 0;
 var $27 = 0, $28 = 0, $29 = 0, $3 = 0, $30 = 0, $31 = 0, $32 = 0, $33 = 0, $34 = 0, $35 = 0, $36 = 0, $37 = 0, $38 = 0, $39 = 0, $4 = 0, $40 = 0, $41 = 0, $42 = 0, $43 = 0, $44 = 0;
 var $45 = 0, $46 = 0, $47 = 0, $48 = 0, $49 = 0, $5 = 0, $50 = 0, $51 = 0, $52 = 0, $53 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, $blue = 0, $green = 0, $red = 0, $value = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $0 = $packed;
 $1 = $colour;
 $2 = $0;
 $3 = HEAP8[$2>>0]|0;
 $4 = $3&255;
 $5 = $0;
 $6 = (($5) + 1|0);
 $7 = HEAP8[$6>>0]|0;
 $8 = $7&255;
 $9 = $8 << 8;
 $10 = $4 | $9;
 $value = $10;
 $11 = $value;
 $12 = $11 >> 11;
 $13 = $12 & 31;
 $14 = $13&255;
 $red = $14;
 $15 = $value;
 $16 = $15 >> 5;
 $17 = $16 & 63;
 $18 = $17&255;
 $green = $18;
 $19 = $value;
 $20 = $19 & 31;
 $21 = $20&255;
 $blue = $21;
 $22 = $red;
 $23 = $22&255;
 $24 = $23 << 3;
 $25 = $red;
 $26 = $25&255;
 $27 = $26 >> 2;
 $28 = $24 | $27;
 $29 = $28&255;
 $30 = $1;
 HEAP8[$30>>0] = $29;
 $31 = $green;
 $32 = $31&255;
 $33 = $32 << 2;
 $34 = $green;
 $35 = $34&255;
 $36 = $35 >> 4;
 $37 = $33 | $36;
 $38 = $37&255;
 $39 = $1;
 $40 = (($39) + 1|0);
 HEAP8[$40>>0] = $38;
 $41 = $blue;
 $42 = $41&255;
 $43 = $42 << 3;
 $44 = $blue;
 $45 = $44&255;
 $46 = $45 >> 2;
 $47 = $43 | $46;
 $48 = $47&255;
 $49 = $1;
 $50 = (($49) + 2|0);
 HEAP8[$50>>0] = $48;
 $51 = $1;
 $52 = (($51) + 3|0);
 HEAP8[$52>>0] = -1;
 $53 = $value;
 STACKTOP = sp;return ($53|0);
}
function __ZN6squishL10FloatToIntEfi5($a,$limit) {
 $a = +$a;
 $limit = $limit|0;
 var $0 = 0.0, $1 = 0, $10 = 0, $11 = 0, $2 = 0.0, $3 = 0.0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, $i = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $0 = $a;
 $1 = $limit;
 $2 = $0;
 $3 = $2 + 0.5;
 $4 = (~~(($3)));
 $i = $4;
 $5 = $i;
 $6 = ($5|0)<(0);
 if ($6) {
  $i = 0;
  $11 = $i;
  STACKTOP = sp;return ($11|0);
 }
 $7 = $i;
 $8 = $1;
 $9 = ($7|0)>($8|0);
 if ($9) {
  $10 = $1;
  $i = $10;
 }
 $11 = $i;
 STACKTOP = sp;return ($11|0);
}
function __ZN6squish9ColourFitC2EPKNS_9ColourSetEi($this,$colours,$flags) {
 $this = $this|0;
 $colours = $colours|0;
 $flags = $flags|0;
 var $0 = 0, $1 = 0, $2 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $0 = $this;
 $1 = $colours;
 $2 = $flags;
 $3 = $0;
 $4 = (96 + 8|0);
 HEAP32[$3>>2] = $4;
 $5 = (($3) + 4|0);
 $6 = $1;
 HEAP32[$5>>2] = $6;
 $7 = (($3) + 8|0);
 $8 = $2;
 HEAP32[$7>>2] = $8;
 STACKTOP = sp;return;
}
function __ZN6squish9ColourFit8CompressEPv($this,$block) {
 $this = $this|0;
 $block = $block|0;
 var $0 = 0, $1 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $2 = 0, $20 = 0, $21 = 0, $22 = 0, $23 = 0, $3 = 0, $4 = 0, $5 = 0;
 var $6 = 0, $7 = 0, $8 = 0, $9 = 0, $isDxt1 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $0 = $this;
 $1 = $block;
 $2 = $0;
 $3 = (($2) + 8|0);
 $4 = HEAP32[$3>>2]|0;
 $5 = $4 & 1;
 $6 = ($5|0)!=(0);
 $7 = $6&1;
 $isDxt1 = $7;
 $8 = $isDxt1;
 $9 = $8&1;
 if (!($9)) {
  $20 = HEAP32[$2>>2]|0;
  $21 = (($20) + 4|0);
  $22 = HEAP32[$21>>2]|0;
  $23 = $1;
  FUNCTION_TABLE_vii[$22 & 7]($2,$23);
  STACKTOP = sp;return;
 }
 $10 = HEAP32[$2>>2]|0;
 $11 = HEAP32[$10>>2]|0;
 $12 = $1;
 FUNCTION_TABLE_vii[$11 & 7]($2,$12);
 $13 = (($2) + 4|0);
 $14 = HEAP32[$13>>2]|0;
 $15 = (__ZNK6squish9ColourSet13IsTransparentEv($14)|0);
 if (!($15)) {
  $16 = HEAP32[$2>>2]|0;
  $17 = (($16) + 4|0);
  $18 = HEAP32[$17>>2]|0;
  $19 = $1;
  FUNCTION_TABLE_vii[$18 & 7]($2,$19);
 }
 STACKTOP = sp;return;
}
function __ZNK6squish9ColourSet13IsTransparentEv($this) {
 $this = $this|0;
 var $0 = 0, $1 = 0, $2 = 0, $3 = 0, $4 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $0 = $this;
 $1 = $0;
 $2 = (($1) + 324|0);
 $3 = HEAP8[$2>>0]|0;
 $4 = $3&1;
 STACKTOP = sp;return ($4|0);
}
function __ZN6squish9ColourSetC2EPKhii($this,$rgba,$mask,$flags) {
 $this = $this|0;
 $rgba = $rgba|0;
 $mask = $mask|0;
 $flags = $flags|0;
 var $0 = 0.0, $1 = 0, $10 = 0, $100 = 0, $101 = 0, $102 = 0, $103 = 0, $104 = 0, $105 = 0, $106 = 0, $107 = 0, $108 = 0, $109 = 0, $11 = 0, $110 = 0, $111 = 0, $112 = 0, $113 = 0, $114 = 0, $115 = 0;
 var $116 = 0, $117 = 0, $118 = 0, $119 = 0, $12 = 0, $120 = 0, $121 = 0, $122 = 0, $123 = 0, $124 = 0, $125 = 0, $126 = 0, $127 = 0, $128 = 0, $129 = 0, $13 = 0, $130 = 0, $131 = 0, $132 = 0, $133 = 0;
 var $134 = 0, $135 = 0, $136 = 0, $137 = 0, $138 = 0, $139 = 0, $14 = 0, $140 = 0, $141 = 0, $142 = 0, $143 = 0, $144 = 0, $145 = 0, $146 = 0, $147 = 0, $148 = 0, $149 = 0, $15 = 0, $150 = 0, $151 = 0;
 var $152 = 0, $153 = 0, $154 = 0, $155 = 0, $156 = 0, $157 = 0, $158 = 0, $159 = 0, $16 = 0, $160 = 0, $161 = 0, $162 = 0, $163 = 0, $164 = 0, $165 = 0, $166 = 0, $167 = 0, $168 = 0, $169 = 0, $17 = 0;
 var $170 = 0, $171 = 0, $172 = 0, $173 = 0, $174 = 0, $175 = 0, $176 = 0, $177 = 0.0, $178 = 0.0, $179 = 0, $18 = 0, $180 = 0, $181 = 0.0, $182 = 0, $183 = 0, $184 = 0, $185 = 0.0, $186 = 0.0, $187 = 0.0, $188 = 0;
 var $189 = 0, $19 = 0, $190 = 0, $191 = 0, $192 = 0, $193 = 0, $194 = 0, $195 = 0, $196 = 0, $197 = 0, $198 = 0, $199 = 0, $2 = 0, $20 = 0, $200 = 0, $201 = 0, $202 = 0.0, $203 = 0.0, $204 = 0.0, $205 = 0;
 var $206 = 0, $207 = 0, $208 = 0, $209 = 0, $21 = 0, $210 = 0, $22 = 0, $23 = 0, $24 = 0, $25 = 0, $26 = 0, $27 = 0, $28 = 0, $29 = 0, $3 = 0, $30 = 0, $31 = 0, $32 = 0, $33 = 0, $34 = 0;
 var $35 = 0, $36 = 0, $37 = 0, $38 = 0, $39 = 0, $4 = 0, $40 = 0, $41 = 0, $42 = 0, $43 = 0, $44 = 0, $45 = 0, $46 = 0, $47 = 0, $48 = 0, $49 = 0, $5 = 0, $50 = 0, $51 = 0, $52 = 0;
 var $53 = 0, $54 = 0.0, $55 = 0.0, $56 = 0, $57 = 0, $58 = 0, $59 = 0, $6 = 0, $60 = 0, $61 = 0, $62 = 0.0, $63 = 0.0, $64 = 0, $65 = 0, $66 = 0, $67 = 0, $68 = 0, $69 = 0, $7 = 0, $70 = 0.0;
 var $71 = 0.0, $72 = 0, $73 = 0, $74 = 0, $75 = 0, $76 = 0, $77 = 0, $78 = 0, $79 = 0, $8 = 0, $80 = 0.0, $81 = 0.0, $82 = 0, $83 = 0, $84 = 0, $85 = 0.0, $86 = 0.0, $87 = 0.0, $88 = 0, $89 = 0;
 var $9 = 0, $90 = 0.0, $91 = 0, $92 = 0, $93 = 0, $94 = 0.0, $95 = 0, $96 = 0, $97 = 0, $98 = 0, $99 = 0, $bit = 0, $i = 0, $i2 = 0, $index = 0, $isDxt1 = 0, $j = 0, $match = 0, $oldbit = 0, $w = 0.0;
 var $w1 = 0.0, $weightByAlpha = 0, $x = 0.0, $y = 0.0, $z = 0.0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 80|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $5 = sp + 16|0;
 $1 = $this;
 $2 = $rgba;
 $3 = $mask;
 $4 = $flags;
 $6 = $1;
 HEAP32[$6>>2] = 0;
 $7 = (($6) + 4|0);
 $8 = (($7) + 192|0);
 $9 = $7;
 while(1) {
  __ZN6squish4Vec3C2Ev($9);
  $10 = (($9) + 12|0);
  $11 = ($10|0)==($8|0);
  if ($11) {
   break;
  } else {
   $9 = $10;
  }
 }
 $12 = (($6) + 324|0);
 HEAP8[$12>>0] = 0;
 $13 = $4;
 $14 = $13 & 1;
 $15 = ($14|0)!=(0);
 $16 = $15&1;
 $isDxt1 = $16;
 $17 = $4;
 $18 = $17 & 128;
 $19 = ($18|0)!=(0);
 $20 = $19&1;
 $weightByAlpha = $20;
 $i = 0;
 while(1) {
  $21 = $i;
  $22 = ($21|0)<(16);
  if (!($22)) {
   break;
  }
  $23 = $i;
  $24 = 1 << $23;
  $bit = $24;
  $25 = $3;
  $26 = $bit;
  $27 = $25 & $26;
  $28 = ($27|0)==(0);
  do {
   if ($28) {
    $29 = $i;
    $30 = (($6) + 260|0);
    $31 = (($30) + ($29<<2)|0);
    HEAP32[$31>>2] = -1;
   } else {
    $32 = $isDxt1;
    $33 = $32&1;
    if ($33) {
     $34 = $i;
     $35 = $34<<2;
     $36 = (($35) + 3)|0;
     $37 = $2;
     $38 = (($37) + ($36)|0);
     $39 = HEAP8[$38>>0]|0;
     $40 = $39&255;
     $41 = ($40|0)<(128);
     if ($41) {
      $42 = $i;
      $43 = (($6) + 260|0);
      $44 = (($43) + ($42<<2)|0);
      HEAP32[$44>>2] = -1;
      $45 = (($6) + 324|0);
      HEAP8[$45>>0] = 1;
      break;
     }
    }
    $j = 0;
    while(1) {
     $46 = $j;
     $47 = $i;
     $48 = ($46|0)==($47|0);
     if ($48) {
      label = 12;
      break;
     }
     $101 = $j;
     $102 = 1 << $101;
     $oldbit = $102;
     $103 = $3;
     $104 = $oldbit;
     $105 = $103 & $104;
     $106 = ($105|0)!=(0);
     if ($106) {
      $107 = $i;
      $108 = $107<<2;
      $109 = $2;
      $110 = (($109) + ($108)|0);
      $111 = HEAP8[$110>>0]|0;
      $112 = $111&255;
      $113 = $j;
      $114 = $113<<2;
      $115 = $2;
      $116 = (($115) + ($114)|0);
      $117 = HEAP8[$116>>0]|0;
      $118 = $117&255;
      $119 = ($112|0)==($118|0);
      if ($119) {
       $120 = $i;
       $121 = $120<<2;
       $122 = (($121) + 1)|0;
       $123 = $2;
       $124 = (($123) + ($122)|0);
       $125 = HEAP8[$124>>0]|0;
       $126 = $125&255;
       $127 = $j;
       $128 = $127<<2;
       $129 = (($128) + 1)|0;
       $130 = $2;
       $131 = (($130) + ($129)|0);
       $132 = HEAP8[$131>>0]|0;
       $133 = $132&255;
       $134 = ($126|0)==($133|0);
       if ($134) {
        $135 = $i;
        $136 = $135<<2;
        $137 = (($136) + 2)|0;
        $138 = $2;
        $139 = (($138) + ($137)|0);
        $140 = HEAP8[$139>>0]|0;
        $141 = $140&255;
        $142 = $j;
        $143 = $142<<2;
        $144 = (($143) + 2)|0;
        $145 = $2;
        $146 = (($145) + ($144)|0);
        $147 = HEAP8[$146>>0]|0;
        $148 = $147&255;
        $149 = ($141|0)==($148|0);
        if ($149) {
         $150 = $j;
         $151 = $150<<2;
         $152 = (($151) + 3)|0;
         $153 = $2;
         $154 = (($153) + ($152)|0);
         $155 = HEAP8[$154>>0]|0;
         $156 = $155&255;
         $157 = ($156|0)>=(128);
         if ($157) {
          $210 = 1;
         } else {
          $158 = $isDxt1;
          $159 = $158&1;
          $160 = $159 ^ 1;
          $210 = $160;
         }
         $162 = $210;
        } else {
         $162 = 0;
        }
       } else {
        $162 = 0;
       }
      } else {
       $162 = 0;
      }
     } else {
      $162 = 0;
     }
     $161 = $162&1;
     $match = $161;
     $163 = $match;
     $164 = $163&1;
     if ($164) {
      label = 24;
      break;
     }
     $192 = $j;
     $193 = (($192) + 1)|0;
     $j = $193;
    }
    if ((label|0) == 12) {
     label = 0;
     $49 = $i;
     $50 = $49<<2;
     $51 = $2;
     $52 = (($51) + ($50)|0);
     $53 = HEAP8[$52>>0]|0;
     $54 = (+($53&255));
     $55 = $54 / 255.0;
     $x = $55;
     $56 = $i;
     $57 = $56<<2;
     $58 = (($57) + 1)|0;
     $59 = $2;
     $60 = (($59) + ($58)|0);
     $61 = HEAP8[$60>>0]|0;
     $62 = (+($61&255));
     $63 = $62 / 255.0;
     $y = $63;
     $64 = $i;
     $65 = $64<<2;
     $66 = (($65) + 2)|0;
     $67 = $2;
     $68 = (($67) + ($66)|0);
     $69 = HEAP8[$68>>0]|0;
     $70 = (+($69&255));
     $71 = $70 / 255.0;
     $z = $71;
     $72 = $i;
     $73 = $72<<2;
     $74 = (($73) + 3)|0;
     $75 = $2;
     $76 = (($75) + ($74)|0);
     $77 = HEAP8[$76>>0]|0;
     $78 = $77&255;
     $79 = (($78) + 1)|0;
     $80 = (+($79|0));
     $81 = $80 / 256.0;
     $w = $81;
     $82 = HEAP32[$6>>2]|0;
     $83 = (($6) + 4|0);
     $84 = (($83) + (($82*12)|0)|0);
     $85 = $x;
     $86 = $y;
     $87 = $z;
     __ZN6squish4Vec3C2Efff($5,$85,$86,$87);
     ;HEAP32[$84+0>>2]=HEAP32[$5+0>>2]|0;HEAP32[$84+4>>2]=HEAP32[$5+4>>2]|0;HEAP32[$84+8>>2]=HEAP32[$5+8>>2]|0;
     $88 = $weightByAlpha;
     $89 = $88&1;
     if ($89) {
      $90 = $w;
      $94 = $90;
     } else {
      $94 = 1.0;
     }
     $91 = HEAP32[$6>>2]|0;
     $92 = (($6) + 196|0);
     $93 = (($92) + ($91<<2)|0);
     HEAPF32[$93>>2] = $94;
     $95 = HEAP32[$6>>2]|0;
     $96 = $i;
     $97 = (($6) + 260|0);
     $98 = (($97) + ($96<<2)|0);
     HEAP32[$98>>2] = $95;
     $99 = HEAP32[$6>>2]|0;
     $100 = (($99) + 1)|0;
     HEAP32[$6>>2] = $100;
    }
    else if ((label|0) == 24) {
     label = 0;
     $165 = $j;
     $166 = (($6) + 260|0);
     $167 = (($166) + ($165<<2)|0);
     $168 = HEAP32[$167>>2]|0;
     $index = $168;
     $169 = $i;
     $170 = $169<<2;
     $171 = (($170) + 3)|0;
     $172 = $2;
     $173 = (($172) + ($171)|0);
     $174 = HEAP8[$173>>0]|0;
     $175 = $174&255;
     $176 = (($175) + 1)|0;
     $177 = (+($176|0));
     $178 = $177 / 256.0;
     $w1 = $178;
     $179 = $weightByAlpha;
     $180 = $179&1;
     if ($180) {
      $181 = $w1;
      $187 = $181;
     } else {
      $187 = 1.0;
     }
     $182 = $index;
     $183 = (($6) + 196|0);
     $184 = (($183) + ($182<<2)|0);
     $185 = +HEAPF32[$184>>2];
     $186 = $185 + $187;
     HEAPF32[$184>>2] = $186;
     $188 = $index;
     $189 = $i;
     $190 = (($6) + 260|0);
     $191 = (($190) + ($189<<2)|0);
     HEAP32[$191>>2] = $188;
    }
   }
  } while(0);
  $194 = $i;
  $195 = (($194) + 1)|0;
  $i = $195;
 }
 $i2 = 0;
 while(1) {
  $196 = $i2;
  $197 = HEAP32[$6>>2]|0;
  $198 = ($196|0)<($197|0);
  if (!($198)) {
   break;
  }
  $199 = $i2;
  $200 = (($6) + 196|0);
  $201 = (($200) + ($199<<2)|0);
  $202 = +HEAPF32[$201>>2];
  $0 = $202;
  $203 = $0;
  $204 = (+Math_sqrt((+$203)));
  $205 = $i2;
  $206 = (($6) + 196|0);
  $207 = (($206) + ($205<<2)|0);
  HEAPF32[$207>>2] = $204;
  $208 = $i2;
  $209 = (($208) + 1)|0;
  $i2 = $209;
 }
 STACKTOP = sp;return;
}
function __ZNK6squish9ColourSet12RemapIndicesEPKhPh($this,$source,$target) {
 $this = $this|0;
 $source = $source|0;
 $target = $target|0;
 var $0 = 0, $1 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $2 = 0, $20 = 0, $21 = 0, $22 = 0, $23 = 0, $3 = 0, $4 = 0, $5 = 0;
 var $6 = 0, $7 = 0, $8 = 0, $9 = 0, $i = 0, $j = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 32|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $0 = $this;
 $1 = $source;
 $2 = $target;
 $3 = $0;
 $i = 0;
 while(1) {
  $4 = $i;
  $5 = ($4|0)<(16);
  if (!($5)) {
   break;
  }
  $6 = $i;
  $7 = (($3) + 260|0);
  $8 = (($7) + ($6<<2)|0);
  $9 = HEAP32[$8>>2]|0;
  $j = $9;
  $10 = $j;
  $11 = ($10|0)==(-1);
  if ($11) {
   $12 = $i;
   $13 = $2;
   $14 = (($13) + ($12)|0);
   HEAP8[$14>>0] = 3;
  } else {
   $15 = $j;
   $16 = $1;
   $17 = (($16) + ($15)|0);
   $18 = HEAP8[$17>>0]|0;
   $19 = $i;
   $20 = $2;
   $21 = (($20) + ($19)|0);
   HEAP8[$21>>0] = $18;
  }
  $22 = $i;
  $23 = (($22) + 1)|0;
  $i = $23;
 }
 STACKTOP = sp;return;
}
function __ZN6squish25ComputeWeightedCovarianceEiPKNS_4Vec3EPKf($agg$result,$n,$points,$weights) {
 $agg$result = $agg$result|0;
 $n = $n|0;
 $points = $points|0;
 $weights = $weights|0;
 var $0 = 0, $1 = 0, $10 = 0.0, $11 = 0.0, $12 = 0.0, $13 = 0, $14 = 0, $15 = 0, $16 = 0.0, $17 = 0, $18 = 0, $19 = 0, $2 = 0, $20 = 0, $21 = 0, $22 = 0.0, $23 = 0, $24 = 0, $25 = 0, $26 = 0;
 var $27 = 0, $28 = 0, $29 = 0, $3 = 0, $30 = 0, $31 = 0, $32 = 0.0, $33 = 0.0, $34 = 0.0, $35 = 0.0, $36 = 0, $37 = 0.0, $38 = 0.0, $39 = 0.0, $4 = 0, $40 = 0.0, $41 = 0.0, $42 = 0, $43 = 0.0, $44 = 0.0;
 var $45 = 0.0, $46 = 0.0, $47 = 0.0, $48 = 0, $49 = 0.0, $5 = 0, $50 = 0.0, $51 = 0.0, $52 = 0.0, $53 = 0.0, $54 = 0, $55 = 0.0, $56 = 0.0, $57 = 0.0, $58 = 0.0, $59 = 0.0, $6 = 0, $60 = 0, $61 = 0.0, $62 = 0.0;
 var $63 = 0.0, $64 = 0.0, $65 = 0.0, $66 = 0, $67 = 0.0, $68 = 0.0, $69 = 0, $7 = 0, $70 = 0, $8 = 0, $9 = 0, $a = 0, $b = 0, $centroid = 0, $i = 0, $i1 = 0, $total = 0.0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 80|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $centroid = sp + 44|0;
 $3 = sp + 28|0;
 $a = sp + 12|0;
 $b = sp;
 $0 = $n;
 $1 = $points;
 $2 = $weights;
 $total = 0.0;
 __ZN6squish4Vec3C2Ef($centroid,0.0);
 $i = 0;
 while(1) {
  $4 = $i;
  $5 = $0;
  $6 = ($4|0)<($5|0);
  if (!($6)) {
   break;
  }
  $7 = $i;
  $8 = $2;
  $9 = (($8) + ($7<<2)|0);
  $10 = +HEAPF32[$9>>2];
  $11 = $total;
  $12 = $11 + $10;
  $total = $12;
  $13 = $i;
  $14 = $2;
  $15 = (($14) + ($13<<2)|0);
  $16 = +HEAPF32[$15>>2];
  $17 = $i;
  $18 = $1;
  $19 = (($18) + (($17*12)|0)|0);
  __ZN6squishmlEfRKNS_4Vec3E($3,$16,$19);
  (__ZN6squish4Vec3pLERKS0_($centroid,$3)|0);
  $20 = $i;
  $21 = (($20) + 1)|0;
  $i = $21;
 }
 $22 = $total;
 (__ZN6squish4Vec3dVEf($centroid,$22)|0);
 __ZN6squish6Sym3x3C2Ef($agg$result,0.0);
 $i1 = 0;
 while(1) {
  $23 = $i1;
  $24 = $0;
  $25 = ($23|0)<($24|0);
  if (!($25)) {
   break;
  }
  $26 = $i1;
  $27 = $1;
  $28 = (($27) + (($26*12)|0)|0);
  __ZN6squishmiERKNS_4Vec3ES2_($a,$28,$centroid);
  $29 = $i1;
  $30 = $2;
  $31 = (($30) + ($29<<2)|0);
  $32 = +HEAPF32[$31>>2];
  __ZN6squishmlEfRKNS_4Vec3E($b,$32,$a);
  $33 = (+__ZNK6squish4Vec31XEv($a));
  $34 = (+__ZNK6squish4Vec31XEv($b));
  $35 = $33 * $34;
  $36 = (__ZN6squish6Sym3x3ixEi($agg$result,0)|0);
  $37 = +HEAPF32[$36>>2];
  $38 = $37 + $35;
  HEAPF32[$36>>2] = $38;
  $39 = (+__ZNK6squish4Vec31XEv($a));
  $40 = (+__ZNK6squish4Vec31YEv($b));
  $41 = $39 * $40;
  $42 = (__ZN6squish6Sym3x3ixEi($agg$result,1)|0);
  $43 = +HEAPF32[$42>>2];
  $44 = $43 + $41;
  HEAPF32[$42>>2] = $44;
  $45 = (+__ZNK6squish4Vec31XEv($a));
  $46 = (+__ZNK6squish4Vec31ZEv($b));
  $47 = $45 * $46;
  $48 = (__ZN6squish6Sym3x3ixEi($agg$result,2)|0);
  $49 = +HEAPF32[$48>>2];
  $50 = $49 + $47;
  HEAPF32[$48>>2] = $50;
  $51 = (+__ZNK6squish4Vec31YEv($a));
  $52 = (+__ZNK6squish4Vec31YEv($b));
  $53 = $51 * $52;
  $54 = (__ZN6squish6Sym3x3ixEi($agg$result,3)|0);
  $55 = +HEAPF32[$54>>2];
  $56 = $55 + $53;
  HEAPF32[$54>>2] = $56;
  $57 = (+__ZNK6squish4Vec31YEv($a));
  $58 = (+__ZNK6squish4Vec31ZEv($b));
  $59 = $57 * $58;
  $60 = (__ZN6squish6Sym3x3ixEi($agg$result,4)|0);
  $61 = +HEAPF32[$60>>2];
  $62 = $61 + $59;
  HEAPF32[$60>>2] = $62;
  $63 = (+__ZNK6squish4Vec31ZEv($a));
  $64 = (+__ZNK6squish4Vec31ZEv($b));
  $65 = $63 * $64;
  $66 = (__ZN6squish6Sym3x3ixEi($agg$result,5)|0);
  $67 = +HEAPF32[$66>>2];
  $68 = $67 + $65;
  HEAPF32[$66>>2] = $68;
  $69 = $i1;
  $70 = (($69) + 1)|0;
  $i1 = $70;
 }
 STACKTOP = sp;return;
}
function __ZN6squish25ComputePrincipleComponentERKNS_6Sym3x3E($agg$result,$matrix) {
 $agg$result = $agg$result|0;
 $matrix = $matrix|0;
 var $0 = 0.0, $1 = 0.0, $10 = 0.0, $100 = 0.0, $101 = 0, $102 = 0.0, $103 = 0.0, $104 = 0, $105 = 0.0, $106 = 0.0, $107 = 0.0, $108 = 0.0, $109 = 0.0, $11 = 0.0, $110 = 0.0, $111 = 0.0, $112 = 0.0, $113 = 0.0, $114 = 0.0, $115 = 0.0;
 var $116 = 0.0, $117 = 0.0, $118 = 0.0, $119 = 0.0, $12 = 0.0, $120 = 0.0, $121 = 0.0, $122 = 0.0, $123 = 0.0, $124 = 0.0, $125 = 0.0, $126 = 0.0, $127 = 0.0, $128 = 0.0, $129 = 0.0, $13 = 0.0, $130 = 0.0, $131 = 0.0, $132 = 0.0, $133 = 0.0;
 var $134 = 0.0, $135 = 0.0, $136 = 0.0, $137 = 0.0, $138 = 0, $139 = 0.0, $14 = 0.0, $140 = 0, $141 = 0.0, $142 = 0.0, $143 = 0.0, $144 = 0.0, $145 = 0.0, $146 = 0.0, $147 = 0.0, $148 = 0.0, $149 = 0.0, $15 = 0.0, $150 = 0.0, $151 = 0.0;
 var $152 = 0.0, $153 = 0.0, $154 = 0.0, $155 = 0.0, $156 = 0.0, $157 = 0.0, $158 = 0.0, $159 = 0.0, $16 = 0.0, $160 = 0.0, $161 = 0.0, $162 = 0.0, $163 = 0.0, $164 = 0.0, $165 = 0.0, $166 = 0.0, $167 = 0.0, $168 = 0.0, $169 = 0.0, $17 = 0.0;
 var $170 = 0.0, $171 = 0.0, $172 = 0.0, $173 = 0.0, $174 = 0.0, $175 = 0.0, $176 = 0.0, $177 = 0.0, $178 = 0.0, $179 = 0.0, $18 = 0, $180 = 0.0, $181 = 0.0, $182 = 0.0, $183 = 0.0, $184 = 0.0, $185 = 0.0, $186 = 0.0, $187 = 0.0, $188 = 0.0;
 var $189 = 0.0, $19 = 0, $190 = 0.0, $191 = 0.0, $192 = 0.0, $193 = 0.0, $194 = 0.0, $195 = 0.0, $196 = 0.0, $197 = 0.0, $198 = 0.0, $199 = 0.0, $2 = 0.0, $20 = 0.0, $200 = 0.0, $201 = 0.0, $202 = 0.0, $203 = 0.0, $204 = 0.0, $205 = 0;
 var $206 = 0.0, $207 = 0.0, $208 = 0.0, $209 = 0.0, $21 = 0, $210 = 0.0, $211 = 0.0, $212 = 0.0, $213 = 0, $214 = 0.0, $215 = 0, $216 = 0.0, $217 = 0.0, $218 = 0, $219 = 0.0, $22 = 0.0, $220 = 0.0, $221 = 0.0, $222 = 0.0, $223 = 0.0;
 var $224 = 0.0, $225 = 0.0, $226 = 0.0, $227 = 0.0, $228 = 0.0, $229 = 0.0, $23 = 0.0, $230 = 0.0, $231 = 0.0, $232 = 0.0, $233 = 0.0, $234 = 0.0, $235 = 0.0, $236 = 0.0, $237 = 0.0, $238 = 0.0, $239 = 0.0, $24 = 0, $240 = 0.0, $241 = 0.0;
 var $242 = 0.0, $243 = 0.0, $244 = 0.0, $245 = 0, $246 = 0, $247 = 0.0, $248 = 0, $249 = 0.0, $25 = 0.0, $26 = 0.0, $27 = 0, $28 = 0.0, $29 = 0.0, $3 = 0.0, $30 = 0, $31 = 0.0, $32 = 0.0, $33 = 0, $34 = 0.0, $35 = 0.0;
 var $36 = 0.0, $37 = 0, $38 = 0.0, $39 = 0, $4 = 0.0, $40 = 0.0, $41 = 0.0, $42 = 0, $43 = 0.0, $44 = 0.0, $45 = 0.0, $46 = 0, $47 = 0.0, $48 = 0, $49 = 0.0, $5 = 0.0, $50 = 0.0, $51 = 0, $52 = 0.0, $53 = 0.0;
 var $54 = 0.0, $55 = 0, $56 = 0.0, $57 = 0, $58 = 0.0, $59 = 0.0, $6 = 0.0, $60 = 0, $61 = 0.0, $62 = 0.0, $63 = 0.0, $64 = 0, $65 = 0.0, $66 = 0, $67 = 0.0, $68 = 0.0, $69 = 0, $7 = 0.0, $70 = 0.0, $71 = 0;
 var $72 = 0.0, $73 = 0.0, $74 = 0.0, $75 = 0, $76 = 0.0, $77 = 0, $78 = 0.0, $79 = 0.0, $8 = 0.0, $80 = 0.0, $81 = 0, $82 = 0.0, $83 = 0, $84 = 0.0, $85 = 0.0, $86 = 0.0, $87 = 0, $88 = 0.0, $89 = 0, $9 = 0.0;
 var $90 = 0.0, $91 = 0.0, $92 = 0.0, $93 = 0, $94 = 0.0, $95 = 0, $96 = 0.0, $97 = 0.0, $98 = 0.0, $99 = 0, $Q = 0.0, $a = 0.0, $b = 0.0, $c0 = 0.0, $c1 = 0.0, $c2 = 0.0, $ct = 0.0, $l1 = 0.0, $l12 = 0.0, $l2 = 0.0;
 var $l23 = 0.0, $l3 = 0.0, $rho = 0.0, $rt = 0.0, $rt1 = 0.0, $st = 0.0, $theta = 0.0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 144|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $18 = $matrix;
 $19 = $18;
 $20 = (+__ZNK6squish6Sym3x3ixEi($19,0));
 $21 = $18;
 $22 = (+__ZNK6squish6Sym3x3ixEi($21,3));
 $23 = $20 * $22;
 $24 = $18;
 $25 = (+__ZNK6squish6Sym3x3ixEi($24,5));
 $26 = $23 * $25;
 $27 = $18;
 $28 = (+__ZNK6squish6Sym3x3ixEi($27,1));
 $29 = 2.0 * $28;
 $30 = $18;
 $31 = (+__ZNK6squish6Sym3x3ixEi($30,2));
 $32 = $29 * $31;
 $33 = $18;
 $34 = (+__ZNK6squish6Sym3x3ixEi($33,4));
 $35 = $32 * $34;
 $36 = $26 + $35;
 $37 = $18;
 $38 = (+__ZNK6squish6Sym3x3ixEi($37,0));
 $39 = $18;
 $40 = (+__ZNK6squish6Sym3x3ixEi($39,4));
 $41 = $38 * $40;
 $42 = $18;
 $43 = (+__ZNK6squish6Sym3x3ixEi($42,4));
 $44 = $41 * $43;
 $45 = $36 - $44;
 $46 = $18;
 $47 = (+__ZNK6squish6Sym3x3ixEi($46,3));
 $48 = $18;
 $49 = (+__ZNK6squish6Sym3x3ixEi($48,2));
 $50 = $47 * $49;
 $51 = $18;
 $52 = (+__ZNK6squish6Sym3x3ixEi($51,2));
 $53 = $50 * $52;
 $54 = $45 - $53;
 $55 = $18;
 $56 = (+__ZNK6squish6Sym3x3ixEi($55,5));
 $57 = $18;
 $58 = (+__ZNK6squish6Sym3x3ixEi($57,1));
 $59 = $56 * $58;
 $60 = $18;
 $61 = (+__ZNK6squish6Sym3x3ixEi($60,1));
 $62 = $59 * $61;
 $63 = $54 - $62;
 $c0 = $63;
 $64 = $18;
 $65 = (+__ZNK6squish6Sym3x3ixEi($64,0));
 $66 = $18;
 $67 = (+__ZNK6squish6Sym3x3ixEi($66,3));
 $68 = $65 * $67;
 $69 = $18;
 $70 = (+__ZNK6squish6Sym3x3ixEi($69,0));
 $71 = $18;
 $72 = (+__ZNK6squish6Sym3x3ixEi($71,5));
 $73 = $70 * $72;
 $74 = $68 + $73;
 $75 = $18;
 $76 = (+__ZNK6squish6Sym3x3ixEi($75,3));
 $77 = $18;
 $78 = (+__ZNK6squish6Sym3x3ixEi($77,5));
 $79 = $76 * $78;
 $80 = $74 + $79;
 $81 = $18;
 $82 = (+__ZNK6squish6Sym3x3ixEi($81,1));
 $83 = $18;
 $84 = (+__ZNK6squish6Sym3x3ixEi($83,1));
 $85 = $82 * $84;
 $86 = $80 - $85;
 $87 = $18;
 $88 = (+__ZNK6squish6Sym3x3ixEi($87,2));
 $89 = $18;
 $90 = (+__ZNK6squish6Sym3x3ixEi($89,2));
 $91 = $88 * $90;
 $92 = $86 - $91;
 $93 = $18;
 $94 = (+__ZNK6squish6Sym3x3ixEi($93,4));
 $95 = $18;
 $96 = (+__ZNK6squish6Sym3x3ixEi($95,4));
 $97 = $94 * $96;
 $98 = $92 - $97;
 $c1 = $98;
 $99 = $18;
 $100 = (+__ZNK6squish6Sym3x3ixEi($99,0));
 $101 = $18;
 $102 = (+__ZNK6squish6Sym3x3ixEi($101,3));
 $103 = $100 + $102;
 $104 = $18;
 $105 = (+__ZNK6squish6Sym3x3ixEi($104,5));
 $106 = $103 + $105;
 $c2 = $106;
 $107 = $c1;
 $108 = $c2;
 $109 = 0.3333333432674408 * $108;
 $110 = $c2;
 $111 = $109 * $110;
 $112 = $107 - $111;
 $a = $112;
 $113 = $c2;
 $114 = -0.074074074625968933 * $113;
 $115 = $c2;
 $116 = $114 * $115;
 $117 = $c2;
 $118 = $116 * $117;
 $119 = $c1;
 $120 = 0.3333333432674408 * $119;
 $121 = $c2;
 $122 = $120 * $121;
 $123 = $118 + $122;
 $124 = $c0;
 $125 = $123 - $124;
 $b = $125;
 $126 = $b;
 $127 = 0.25 * $126;
 $128 = $b;
 $129 = $127 * $128;
 $130 = $a;
 $131 = 0.037037037312984467 * $130;
 $132 = $a;
 $133 = $131 * $132;
 $134 = $a;
 $135 = $133 * $134;
 $136 = $129 + $135;
 $Q = $136;
 $137 = $Q;
 $138 = 1.1920928955078125E-7 < $137;
 if ($138) {
  __ZN6squish4Vec3C2Ef($agg$result,1.0);
  STACKTOP = sp;return;
 }
 $139 = $Q;
 $140 = $139 < -1.1920928955078125E-7;
 if ($140) {
  $141 = $Q;
  $142 = -$141;
  $17 = $142;
  $143 = $17;
  $144 = (+Math_sqrt((+$143)));
  $145 = $b;
  $146 = -0.5 * $145;
  $15 = $144;
  $16 = $146;
  $147 = $15;
  $148 = $16;
  $149 = (+Math_atan2((+$147),(+$148)));
  $theta = $149;
  $150 = $b;
  $151 = 0.25 * $150;
  $152 = $b;
  $153 = $151 * $152;
  $154 = $Q;
  $155 = $153 - $154;
  $14 = $155;
  $156 = $14;
  $157 = (+Math_sqrt((+$156)));
  $rho = $157;
  $158 = $rho;
  $12 = $158;
  $13 = 0.3333333432674408;
  $159 = $12;
  $160 = $13;
  $161 = (+Math_pow((+$159),(+$160)));
  $rt = $161;
  $162 = $theta;
  $163 = $162 / 3.0;
  $11 = $163;
  $164 = $11;
  $165 = (+Math_cos((+$164)));
  $ct = $165;
  $166 = $theta;
  $167 = $166 / 3.0;
  $10 = $167;
  $168 = $10;
  $169 = (+Math_sin((+$168)));
  $st = $169;
  $170 = $c2;
  $171 = 0.3333333432674408 * $170;
  $172 = $rt;
  $173 = 2.0 * $172;
  $174 = $ct;
  $175 = $173 * $174;
  $176 = $171 + $175;
  $l1 = $176;
  $177 = $c2;
  $178 = 0.3333333432674408 * $177;
  $179 = $rt;
  $180 = $ct;
  $181 = (+Math_sqrt(3.0));
  $182 = $181;
  $183 = $st;
  $184 = $182 * $183;
  $185 = $180 + $184;
  $186 = $179 * $185;
  $187 = $178 - $186;
  $l2 = $187;
  $188 = $c2;
  $189 = 0.3333333432674408 * $188;
  $190 = $rt;
  $191 = $ct;
  $192 = (+Math_sqrt(3.0));
  $193 = $192;
  $194 = $st;
  $195 = $193 * $194;
  $196 = $191 - $195;
  $197 = $190 * $196;
  $198 = $189 - $197;
  $l3 = $198;
  $199 = $l2;
  $9 = $199;
  $200 = $9;
  $201 = (+Math_abs((+$200)));
  $202 = $l1;
  $8 = $202;
  $203 = $8;
  $204 = (+Math_abs((+$203)));
  $205 = $201 > $204;
  if ($205) {
   $206 = $l2;
   $l1 = $206;
  }
  $207 = $l3;
  $7 = $207;
  $208 = $7;
  $209 = (+Math_abs((+$208)));
  $210 = $l1;
  $6 = $210;
  $211 = $6;
  $212 = (+Math_abs((+$211)));
  $213 = $209 > $212;
  if ($213) {
   $214 = $l3;
   $l1 = $214;
  }
  $215 = $18;
  $216 = $l1;
  __ZN6squishL23GetMultiplicity1EvectorERKNS_6Sym3x3Ef($agg$result,$215,$216);
  STACKTOP = sp;return;
 }
 $217 = $b;
 $218 = $217 < 0.0;
 if ($218) {
  $219 = $b;
  $220 = -0.5 * $219;
  $4 = $220;
  $5 = 0.3333333432674408;
  $221 = $4;
  $222 = $5;
  $223 = (+Math_pow((+$221),(+$222)));
  $224 = -$223;
  $rt1 = $224;
 } else {
  $225 = $b;
  $226 = 0.5 * $225;
  $2 = $226;
  $3 = 0.3333333432674408;
  $227 = $2;
  $228 = $3;
  $229 = (+Math_pow((+$227),(+$228)));
  $rt1 = $229;
 }
 $230 = $c2;
 $231 = 0.3333333432674408 * $230;
 $232 = $rt1;
 $233 = $231 + $232;
 $l12 = $233;
 $234 = $c2;
 $235 = 0.3333333432674408 * $234;
 $236 = $rt1;
 $237 = 2.0 * $236;
 $238 = $235 - $237;
 $l23 = $238;
 $239 = $l12;
 $0 = $239;
 $240 = $0;
 $241 = (+Math_abs((+$240)));
 $242 = $l23;
 $1 = $242;
 $243 = $1;
 $244 = (+Math_abs((+$243)));
 $245 = $241 > $244;
 if ($245) {
  $246 = $18;
  $247 = $l12;
  __ZN6squishL23GetMultiplicity2EvectorERKNS_6Sym3x3Ef($agg$result,$246,$247);
  STACKTOP = sp;return;
 } else {
  $248 = $18;
  $249 = $l23;
  __ZN6squishL23GetMultiplicity1EvectorERKNS_6Sym3x3Ef($agg$result,$248,$249);
  STACKTOP = sp;return;
 }
}
function __ZN6squish4Vec3C2Ef($this,$s) {
 $this = $this|0;
 $s = +$s;
 var $0 = 0, $1 = 0.0, $2 = 0, $3 = 0.0, $4 = 0.0, $5 = 0, $6 = 0.0, $7 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $0 = $this;
 $1 = $s;
 $2 = $0;
 $3 = $1;
 HEAPF32[$2>>2] = $3;
 $4 = $1;
 $5 = (($2) + 4|0);
 HEAPF32[$5>>2] = $4;
 $6 = $1;
 $7 = (($2) + 8|0);
 HEAPF32[$7>>2] = $6;
 STACKTOP = sp;return;
}
function __ZN6squishmlEfRKNS_4Vec3E($agg$result,$left,$right) {
 $agg$result = $agg$result|0;
 $left = +$left;
 $right = $right|0;
 var $0 = 0.0, $1 = 0, $2 = 0, $3 = 0.0, $4 = 0, $copy = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 32|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $copy = sp;
 $0 = $left;
 $1 = $right;
 $2 = $1;
 ;HEAP32[$copy+0>>2]=HEAP32[$2+0>>2]|0;HEAP32[$copy+4>>2]=HEAP32[$2+4>>2]|0;HEAP32[$copy+8>>2]=HEAP32[$2+8>>2]|0;
 $3 = $0;
 $4 = (__ZN6squish4Vec3mLEf($copy,$3)|0);
 ;HEAP32[$agg$result+0>>2]=HEAP32[$4+0>>2]|0;HEAP32[$agg$result+4>>2]=HEAP32[$4+4>>2]|0;HEAP32[$agg$result+8>>2]=HEAP32[$4+8>>2]|0;
 STACKTOP = sp;return;
}
function __ZN6squish4Vec3pLERKS0_($this,$v) {
 $this = $this|0;
 $v = $v|0;
 var $0 = 0, $1 = 0, $10 = 0, $11 = 0.0, $12 = 0.0, $13 = 0, $14 = 0, $15 = 0.0, $16 = 0, $17 = 0.0, $18 = 0.0, $2 = 0, $3 = 0, $4 = 0.0, $5 = 0.0, $6 = 0.0, $7 = 0, $8 = 0, $9 = 0.0, label = 0;
 var sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $0 = $this;
 $1 = $v;
 $2 = $0;
 $3 = $1;
 $4 = +HEAPF32[$3>>2];
 $5 = +HEAPF32[$2>>2];
 $6 = $5 + $4;
 HEAPF32[$2>>2] = $6;
 $7 = $1;
 $8 = (($7) + 4|0);
 $9 = +HEAPF32[$8>>2];
 $10 = (($2) + 4|0);
 $11 = +HEAPF32[$10>>2];
 $12 = $11 + $9;
 HEAPF32[$10>>2] = $12;
 $13 = $1;
 $14 = (($13) + 8|0);
 $15 = +HEAPF32[$14>>2];
 $16 = (($2) + 8|0);
 $17 = +HEAPF32[$16>>2];
 $18 = $17 + $15;
 HEAPF32[$16>>2] = $18;
 STACKTOP = sp;return ($2|0);
}
function __ZN6squish4Vec3dVEf($this,$s) {
 $this = $this|0;
 $s = +$s;
 var $0 = 0, $1 = 0.0, $10 = 0.0, $11 = 0.0, $12 = 0.0, $13 = 0, $14 = 0.0, $15 = 0.0, $2 = 0, $3 = 0.0, $4 = 0.0, $5 = 0.0, $6 = 0.0, $7 = 0.0, $8 = 0.0, $9 = 0, $t = 0.0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $0 = $this;
 $1 = $s;
 $2 = $0;
 $3 = $1;
 $4 = 1.0 / $3;
 $t = $4;
 $5 = $t;
 $6 = +HEAPF32[$2>>2];
 $7 = $6 * $5;
 HEAPF32[$2>>2] = $7;
 $8 = $t;
 $9 = (($2) + 4|0);
 $10 = +HEAPF32[$9>>2];
 $11 = $10 * $8;
 HEAPF32[$9>>2] = $11;
 $12 = $t;
 $13 = (($2) + 8|0);
 $14 = +HEAPF32[$13>>2];
 $15 = $14 * $12;
 HEAPF32[$13>>2] = $15;
 STACKTOP = sp;return ($2|0);
}
function __ZN6squish6Sym3x3C2Ef($this,$s) {
 $this = $this|0;
 $s = +$s;
 var $0 = 0, $1 = 0.0, $2 = 0, $3 = 0, $4 = 0, $5 = 0.0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, $i = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $0 = $this;
 $1 = $s;
 $2 = $0;
 $i = 0;
 while(1) {
  $3 = $i;
  $4 = ($3|0)<(6);
  if (!($4)) {
   break;
  }
  $5 = $1;
  $6 = $i;
  $7 = (($2) + ($6<<2)|0);
  HEAPF32[$7>>2] = $5;
  $8 = $i;
  $9 = (($8) + 1)|0;
  $i = $9;
 }
 STACKTOP = sp;return;
}
function __ZN6squishmiERKNS_4Vec3ES2_($agg$result,$left,$right) {
 $agg$result = $agg$result|0;
 $left = $left|0;
 $right = $right|0;
 var $0 = 0, $1 = 0, $2 = 0, $3 = 0, $4 = 0, $copy = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 32|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $copy = sp;
 $0 = $left;
 $1 = $right;
 $2 = $0;
 ;HEAP32[$copy+0>>2]=HEAP32[$2+0>>2]|0;HEAP32[$copy+4>>2]=HEAP32[$2+4>>2]|0;HEAP32[$copy+8>>2]=HEAP32[$2+8>>2]|0;
 $3 = $1;
 $4 = (__ZN6squish4Vec3mIERKS0_($copy,$3)|0);
 ;HEAP32[$agg$result+0>>2]=HEAP32[$4+0>>2]|0;HEAP32[$agg$result+4>>2]=HEAP32[$4+4>>2]|0;HEAP32[$agg$result+8>>2]=HEAP32[$4+8>>2]|0;
 STACKTOP = sp;return;
}
function __ZN6squish6Sym3x3ixEi($this,$index) {
 $this = $this|0;
 $index = $index|0;
 var $0 = 0, $1 = 0, $2 = 0, $3 = 0, $4 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $0 = $this;
 $1 = $index;
 $2 = $0;
 $3 = $1;
 $4 = (($2) + ($3<<2)|0);
 STACKTOP = sp;return ($4|0);
}
function __ZNK6squish6Sym3x3ixEi($this,$index) {
 $this = $this|0;
 $index = $index|0;
 var $0 = 0, $1 = 0, $2 = 0, $3 = 0, $4 = 0, $5 = 0.0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $0 = $this;
 $1 = $index;
 $2 = $0;
 $3 = $1;
 $4 = (($2) + ($3<<2)|0);
 $5 = +HEAPF32[$4>>2];
 STACKTOP = sp;return (+$5);
}
function __ZN6squishL23GetMultiplicity1EvectorERKNS_6Sym3x3Ef($agg$result,$matrix,$evalue) {
 $agg$result = $agg$result|0;
 $matrix = $matrix|0;
 $evalue = +$evalue;
 var $0 = 0.0, $1 = 0.0, $10 = 0.0, $100 = 0, $101 = 0.0, $102 = 0.0, $103 = 0.0, $104 = 0, $105 = 0, $106 = 0, $107 = 0, $108 = 0.0, $109 = 0.0, $11 = 0, $110 = 0.0, $111 = 0.0, $112 = 0.0, $113 = 0, $114 = 0.0, $115 = 0;
 var $116 = 0, $117 = 0, $118 = 0, $119 = 0, $12 = 0, $120 = 0.0, $121 = 0, $122 = 0.0, $123 = 0, $124 = 0.0, $125 = 0, $126 = 0.0, $127 = 0, $128 = 0.0, $129 = 0, $13 = 0.0, $130 = 0.0, $131 = 0, $132 = 0.0, $133 = 0;
 var $134 = 0.0, $135 = 0, $136 = 0.0, $14 = 0, $15 = 0, $16 = 0.0, $17 = 0.0, $18 = 0.0, $19 = 0, $2 = 0, $20 = 0, $21 = 0.0, $22 = 0, $23 = 0, $24 = 0.0, $25 = 0.0, $26 = 0.0, $27 = 0, $28 = 0, $29 = 0.0;
 var $3 = 0.0, $30 = 0, $31 = 0.0, $32 = 0.0, $33 = 0, $34 = 0.0, $35 = 0, $36 = 0.0, $37 = 0.0, $38 = 0.0, $39 = 0, $4 = 0, $40 = 0, $41 = 0.0, $42 = 0, $43 = 0.0, $44 = 0.0, $45 = 0, $46 = 0.0, $47 = 0;
 var $48 = 0.0, $49 = 0.0, $5 = 0.0, $50 = 0.0, $51 = 0, $52 = 0, $53 = 0.0, $54 = 0, $55 = 0.0, $56 = 0.0, $57 = 0, $58 = 0.0, $59 = 0, $6 = 0.0, $60 = 0.0, $61 = 0.0, $62 = 0.0, $63 = 0, $64 = 0, $65 = 0.0;
 var $66 = 0, $67 = 0.0, $68 = 0.0, $69 = 0, $7 = 0.0, $70 = 0.0, $71 = 0, $72 = 0.0, $73 = 0.0, $74 = 0.0, $75 = 0, $76 = 0, $77 = 0.0, $78 = 0, $79 = 0.0, $8 = 0, $80 = 0.0, $81 = 0, $82 = 0.0, $83 = 0;
 var $84 = 0.0, $85 = 0.0, $86 = 0.0, $87 = 0, $88 = 0, $89 = 0.0, $9 = 0, $90 = 0, $91 = 0.0, $92 = 0.0, $93 = 0, $94 = 0.0, $95 = 0, $96 = 0.0, $97 = 0.0, $98 = 0.0, $99 = 0, $c = 0.0, $i = 0, $m = 0;
 var $mc = 0.0, $mi = 0, $u = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 80|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $m = sp + 40|0;
 $u = sp + 16|0;
 $2 = $matrix;
 $3 = $evalue;
 __ZN6squish6Sym3x3C2Ev($m);
 $4 = $2;
 $5 = (+__ZNK6squish6Sym3x3ixEi($4,0));
 $6 = $3;
 $7 = $5 - $6;
 $8 = (__ZN6squish6Sym3x3ixEi($m,0)|0);
 HEAPF32[$8>>2] = $7;
 $9 = $2;
 $10 = (+__ZNK6squish6Sym3x3ixEi($9,1));
 $11 = (__ZN6squish6Sym3x3ixEi($m,1)|0);
 HEAPF32[$11>>2] = $10;
 $12 = $2;
 $13 = (+__ZNK6squish6Sym3x3ixEi($12,2));
 $14 = (__ZN6squish6Sym3x3ixEi($m,2)|0);
 HEAPF32[$14>>2] = $13;
 $15 = $2;
 $16 = (+__ZNK6squish6Sym3x3ixEi($15,3));
 $17 = $3;
 $18 = $16 - $17;
 $19 = (__ZN6squish6Sym3x3ixEi($m,3)|0);
 HEAPF32[$19>>2] = $18;
 $20 = $2;
 $21 = (+__ZNK6squish6Sym3x3ixEi($20,4));
 $22 = (__ZN6squish6Sym3x3ixEi($m,4)|0);
 HEAPF32[$22>>2] = $21;
 $23 = $2;
 $24 = (+__ZNK6squish6Sym3x3ixEi($23,5));
 $25 = $3;
 $26 = $24 - $25;
 $27 = (__ZN6squish6Sym3x3ixEi($m,5)|0);
 HEAPF32[$27>>2] = $26;
 __ZN6squish6Sym3x3C2Ev($u);
 $28 = (__ZN6squish6Sym3x3ixEi($m,3)|0);
 $29 = +HEAPF32[$28>>2];
 $30 = (__ZN6squish6Sym3x3ixEi($m,5)|0);
 $31 = +HEAPF32[$30>>2];
 $32 = $29 * $31;
 $33 = (__ZN6squish6Sym3x3ixEi($m,4)|0);
 $34 = +HEAPF32[$33>>2];
 $35 = (__ZN6squish6Sym3x3ixEi($m,4)|0);
 $36 = +HEAPF32[$35>>2];
 $37 = $34 * $36;
 $38 = $32 - $37;
 $39 = (__ZN6squish6Sym3x3ixEi($u,0)|0);
 HEAPF32[$39>>2] = $38;
 $40 = (__ZN6squish6Sym3x3ixEi($m,2)|0);
 $41 = +HEAPF32[$40>>2];
 $42 = (__ZN6squish6Sym3x3ixEi($m,4)|0);
 $43 = +HEAPF32[$42>>2];
 $44 = $41 * $43;
 $45 = (__ZN6squish6Sym3x3ixEi($m,1)|0);
 $46 = +HEAPF32[$45>>2];
 $47 = (__ZN6squish6Sym3x3ixEi($m,5)|0);
 $48 = +HEAPF32[$47>>2];
 $49 = $46 * $48;
 $50 = $44 - $49;
 $51 = (__ZN6squish6Sym3x3ixEi($u,1)|0);
 HEAPF32[$51>>2] = $50;
 $52 = (__ZN6squish6Sym3x3ixEi($m,1)|0);
 $53 = +HEAPF32[$52>>2];
 $54 = (__ZN6squish6Sym3x3ixEi($m,4)|0);
 $55 = +HEAPF32[$54>>2];
 $56 = $53 * $55;
 $57 = (__ZN6squish6Sym3x3ixEi($m,2)|0);
 $58 = +HEAPF32[$57>>2];
 $59 = (__ZN6squish6Sym3x3ixEi($m,3)|0);
 $60 = +HEAPF32[$59>>2];
 $61 = $58 * $60;
 $62 = $56 - $61;
 $63 = (__ZN6squish6Sym3x3ixEi($u,2)|0);
 HEAPF32[$63>>2] = $62;
 $64 = (__ZN6squish6Sym3x3ixEi($m,0)|0);
 $65 = +HEAPF32[$64>>2];
 $66 = (__ZN6squish6Sym3x3ixEi($m,5)|0);
 $67 = +HEAPF32[$66>>2];
 $68 = $65 * $67;
 $69 = (__ZN6squish6Sym3x3ixEi($m,2)|0);
 $70 = +HEAPF32[$69>>2];
 $71 = (__ZN6squish6Sym3x3ixEi($m,2)|0);
 $72 = +HEAPF32[$71>>2];
 $73 = $70 * $72;
 $74 = $68 - $73;
 $75 = (__ZN6squish6Sym3x3ixEi($u,3)|0);
 HEAPF32[$75>>2] = $74;
 $76 = (__ZN6squish6Sym3x3ixEi($m,1)|0);
 $77 = +HEAPF32[$76>>2];
 $78 = (__ZN6squish6Sym3x3ixEi($m,2)|0);
 $79 = +HEAPF32[$78>>2];
 $80 = $77 * $79;
 $81 = (__ZN6squish6Sym3x3ixEi($m,4)|0);
 $82 = +HEAPF32[$81>>2];
 $83 = (__ZN6squish6Sym3x3ixEi($m,0)|0);
 $84 = +HEAPF32[$83>>2];
 $85 = $82 * $84;
 $86 = $80 - $85;
 $87 = (__ZN6squish6Sym3x3ixEi($u,4)|0);
 HEAPF32[$87>>2] = $86;
 $88 = (__ZN6squish6Sym3x3ixEi($m,0)|0);
 $89 = +HEAPF32[$88>>2];
 $90 = (__ZN6squish6Sym3x3ixEi($m,3)|0);
 $91 = +HEAPF32[$90>>2];
 $92 = $89 * $91;
 $93 = (__ZN6squish6Sym3x3ixEi($m,1)|0);
 $94 = +HEAPF32[$93>>2];
 $95 = (__ZN6squish6Sym3x3ixEi($m,1)|0);
 $96 = +HEAPF32[$95>>2];
 $97 = $94 * $96;
 $98 = $92 - $97;
 $99 = (__ZN6squish6Sym3x3ixEi($u,5)|0);
 HEAPF32[$99>>2] = $98;
 $100 = (__ZN6squish6Sym3x3ixEi($u,0)|0);
 $101 = +HEAPF32[$100>>2];
 $1 = $101;
 $102 = $1;
 $103 = (+Math_abs((+$102)));
 $mc = $103;
 $mi = 0;
 $i = 1;
 while(1) {
  $104 = $i;
  $105 = ($104|0)<(6);
  if (!($105)) {
   break;
  }
  $106 = $i;
  $107 = (__ZN6squish6Sym3x3ixEi($u,$106)|0);
  $108 = +HEAPF32[$107>>2];
  $0 = $108;
  $109 = $0;
  $110 = (+Math_abs((+$109)));
  $c = $110;
  $111 = $c;
  $112 = $mc;
  $113 = $111 > $112;
  if ($113) {
   $114 = $c;
   $mc = $114;
   $115 = $i;
   $mi = $115;
  }
  $116 = $i;
  $117 = (($116) + 1)|0;
  $i = $117;
 }
 $118 = $mi;
 if ((($118|0) == 0)) {
  $119 = (__ZN6squish6Sym3x3ixEi($u,0)|0);
  $120 = +HEAPF32[$119>>2];
  $121 = (__ZN6squish6Sym3x3ixEi($u,1)|0);
  $122 = +HEAPF32[$121>>2];
  $123 = (__ZN6squish6Sym3x3ixEi($u,2)|0);
  $124 = +HEAPF32[$123>>2];
  __ZN6squish4Vec3C2Efff($agg$result,$120,$122,$124);
  STACKTOP = sp;return;
 } else if ((($118|0) == 3) | (($118|0) == 1)) {
  $125 = (__ZN6squish6Sym3x3ixEi($u,1)|0);
  $126 = +HEAPF32[$125>>2];
  $127 = (__ZN6squish6Sym3x3ixEi($u,3)|0);
  $128 = +HEAPF32[$127>>2];
  $129 = (__ZN6squish6Sym3x3ixEi($u,4)|0);
  $130 = +HEAPF32[$129>>2];
  __ZN6squish4Vec3C2Efff($agg$result,$126,$128,$130);
  STACKTOP = sp;return;
 } else {
  $131 = (__ZN6squish6Sym3x3ixEi($u,2)|0);
  $132 = +HEAPF32[$131>>2];
  $133 = (__ZN6squish6Sym3x3ixEi($u,4)|0);
  $134 = +HEAPF32[$133>>2];
  $135 = (__ZN6squish6Sym3x3ixEi($u,5)|0);
  $136 = +HEAPF32[$135>>2];
  __ZN6squish4Vec3C2Efff($agg$result,$132,$134,$136);
  STACKTOP = sp;return;
 }
}
function __ZN6squishL23GetMultiplicity2EvectorERKNS_6Sym3x3Ef($agg$result,$matrix,$evalue) {
 $agg$result = $agg$result|0;
 $matrix = $matrix|0;
 $evalue = +$evalue;
 var $0 = 0.0, $1 = 0.0, $10 = 0.0, $11 = 0, $12 = 0, $13 = 0.0, $14 = 0, $15 = 0, $16 = 0.0, $17 = 0.0, $18 = 0.0, $19 = 0, $2 = 0, $20 = 0, $21 = 0.0, $22 = 0, $23 = 0, $24 = 0.0, $25 = 0.0, $26 = 0.0;
 var $27 = 0, $28 = 0, $29 = 0.0, $3 = 0.0, $30 = 0.0, $31 = 0.0, $32 = 0, $33 = 0, $34 = 0, $35 = 0, $36 = 0.0, $37 = 0.0, $38 = 0.0, $39 = 0.0, $4 = 0, $40 = 0.0, $41 = 0, $42 = 0.0, $43 = 0, $44 = 0;
 var $45 = 0, $46 = 0, $47 = 0, $48 = 0.0, $49 = 0.0, $5 = 0.0, $50 = 0, $51 = 0.0, $52 = 0, $53 = 0.0, $54 = 0, $55 = 0.0, $56 = 0.0, $57 = 0, $58 = 0.0, $59 = 0.0, $6 = 0.0, $60 = 0, $61 = 0.0, $62 = 0;
 var $63 = 0.0, $64 = 0.0, $65 = 0, $66 = 0.0, $7 = 0.0, $8 = 0, $9 = 0, $c = 0.0, $i = 0, $m = 0, $mc = 0.0, $mi = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 64|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $m = sp + 16|0;
 $2 = $matrix;
 $3 = $evalue;
 __ZN6squish6Sym3x3C2Ev($m);
 $4 = $2;
 $5 = (+__ZNK6squish6Sym3x3ixEi($4,0));
 $6 = $3;
 $7 = $5 - $6;
 $8 = (__ZN6squish6Sym3x3ixEi($m,0)|0);
 HEAPF32[$8>>2] = $7;
 $9 = $2;
 $10 = (+__ZNK6squish6Sym3x3ixEi($9,1));
 $11 = (__ZN6squish6Sym3x3ixEi($m,1)|0);
 HEAPF32[$11>>2] = $10;
 $12 = $2;
 $13 = (+__ZNK6squish6Sym3x3ixEi($12,2));
 $14 = (__ZN6squish6Sym3x3ixEi($m,2)|0);
 HEAPF32[$14>>2] = $13;
 $15 = $2;
 $16 = (+__ZNK6squish6Sym3x3ixEi($15,3));
 $17 = $3;
 $18 = $16 - $17;
 $19 = (__ZN6squish6Sym3x3ixEi($m,3)|0);
 HEAPF32[$19>>2] = $18;
 $20 = $2;
 $21 = (+__ZNK6squish6Sym3x3ixEi($20,4));
 $22 = (__ZN6squish6Sym3x3ixEi($m,4)|0);
 HEAPF32[$22>>2] = $21;
 $23 = $2;
 $24 = (+__ZNK6squish6Sym3x3ixEi($23,5));
 $25 = $3;
 $26 = $24 - $25;
 $27 = (__ZN6squish6Sym3x3ixEi($m,5)|0);
 HEAPF32[$27>>2] = $26;
 $28 = (__ZN6squish6Sym3x3ixEi($m,0)|0);
 $29 = +HEAPF32[$28>>2];
 $1 = $29;
 $30 = $1;
 $31 = (+Math_abs((+$30)));
 $mc = $31;
 $mi = 0;
 $i = 1;
 while(1) {
  $32 = $i;
  $33 = ($32|0)<(6);
  if (!($33)) {
   break;
  }
  $34 = $i;
  $35 = (__ZN6squish6Sym3x3ixEi($m,$34)|0);
  $36 = +HEAPF32[$35>>2];
  $0 = $36;
  $37 = $0;
  $38 = (+Math_abs((+$37)));
  $c = $38;
  $39 = $c;
  $40 = $mc;
  $41 = $39 > $40;
  if ($41) {
   $42 = $c;
   $mc = $42;
   $43 = $i;
   $mi = $43;
  }
  $44 = $i;
  $45 = (($44) + 1)|0;
  $i = $45;
 }
 $46 = $mi;
 switch ($46|0) {
 case 4: case 3:  {
  $57 = (__ZN6squish6Sym3x3ixEi($m,4)|0);
  $58 = +HEAPF32[$57>>2];
  $59 = -$58;
  $60 = (__ZN6squish6Sym3x3ixEi($m,3)|0);
  $61 = +HEAPF32[$60>>2];
  __ZN6squish4Vec3C2Efff($agg$result,0.0,$59,$61);
  STACKTOP = sp;return;
  break;
 }
 case 1: case 0:  {
  $47 = (__ZN6squish6Sym3x3ixEi($m,1)|0);
  $48 = +HEAPF32[$47>>2];
  $49 = -$48;
  $50 = (__ZN6squish6Sym3x3ixEi($m,0)|0);
  $51 = +HEAPF32[$50>>2];
  __ZN6squish4Vec3C2Efff($agg$result,$49,$51,0.0);
  STACKTOP = sp;return;
  break;
 }
 case 2:  {
  $52 = (__ZN6squish6Sym3x3ixEi($m,2)|0);
  $53 = +HEAPF32[$52>>2];
  $54 = (__ZN6squish6Sym3x3ixEi($m,0)|0);
  $55 = +HEAPF32[$54>>2];
  $56 = -$55;
  __ZN6squish4Vec3C2Efff($agg$result,$53,0.0,$56);
  STACKTOP = sp;return;
  break;
 }
 default: {
  $62 = (__ZN6squish6Sym3x3ixEi($m,5)|0);
  $63 = +HEAPF32[$62>>2];
  $64 = -$63;
  $65 = (__ZN6squish6Sym3x3ixEi($m,4)|0);
  $66 = +HEAPF32[$65>>2];
  __ZN6squish4Vec3C2Efff($agg$result,0.0,$64,$66);
  STACKTOP = sp;return;
 }
 }
}
function __ZN6squish4Vec3mLEf($this,$s) {
 $this = $this|0;
 $s = +$s;
 var $0 = 0, $1 = 0.0, $10 = 0.0, $11 = 0, $12 = 0.0, $13 = 0.0, $2 = 0, $3 = 0.0, $4 = 0.0, $5 = 0.0, $6 = 0.0, $7 = 0, $8 = 0.0, $9 = 0.0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $0 = $this;
 $1 = $s;
 $2 = $0;
 $3 = $1;
 $4 = +HEAPF32[$2>>2];
 $5 = $4 * $3;
 HEAPF32[$2>>2] = $5;
 $6 = $1;
 $7 = (($2) + 4|0);
 $8 = +HEAPF32[$7>>2];
 $9 = $8 * $6;
 HEAPF32[$7>>2] = $9;
 $10 = $1;
 $11 = (($2) + 8|0);
 $12 = +HEAPF32[$11>>2];
 $13 = $12 * $10;
 HEAPF32[$11>>2] = $13;
 STACKTOP = sp;return ($2|0);
}
function __ZN6squish4Vec3mIERKS0_($this,$v) {
 $this = $this|0;
 $v = $v|0;
 var $0 = 0, $1 = 0, $10 = 0, $11 = 0.0, $12 = 0.0, $13 = 0, $14 = 0, $15 = 0.0, $16 = 0, $17 = 0.0, $18 = 0.0, $2 = 0, $3 = 0, $4 = 0.0, $5 = 0.0, $6 = 0.0, $7 = 0, $8 = 0, $9 = 0.0, label = 0;
 var sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $0 = $this;
 $1 = $v;
 $2 = $0;
 $3 = $1;
 $4 = +HEAPF32[$3>>2];
 $5 = +HEAPF32[$2>>2];
 $6 = $5 - $4;
 HEAPF32[$2>>2] = $6;
 $7 = $1;
 $8 = (($7) + 4|0);
 $9 = +HEAPF32[$8>>2];
 $10 = (($2) + 4|0);
 $11 = +HEAPF32[$10>>2];
 $12 = $11 - $9;
 HEAPF32[$10>>2] = $12;
 $13 = $1;
 $14 = (($13) + 8|0);
 $15 = +HEAPF32[$14>>2];
 $16 = (($2) + 8|0);
 $17 = +HEAPF32[$16>>2];
 $18 = $17 - $15;
 HEAPF32[$16>>2] = $18;
 STACKTOP = sp;return ($2|0);
}
function __ZN6squish6Sym3x3C2Ev($this) {
 $this = $this|0;
 var $0 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $0 = $this;
 STACKTOP = sp;return;
}
function __ZN6squish8RangeFitC2EPKNS_9ColourSetEi($this,$colours,$flags) {
 $this = $this|0;
 $colours = $colours|0;
 $flags = $flags|0;
 var $0 = 0, $1 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $2 = 0, $20 = 0, $21 = 0, $22 = 0, $23 = 0, $24 = 0, $25 = 0, $26 = 0;
 var $27 = 0, $28 = 0, $29 = 0, $3 = 0, $30 = 0, $31 = 0, $32 = 0, $33 = 0, $34 = 0, $35 = 0, $36 = 0, $37 = 0, $38 = 0, $39 = 0, $4 = 0, $40 = 0, $41 = 0, $42 = 0, $43 = 0, $44 = 0;
 var $45 = 0, $46 = 0, $47 = 0, $48 = 0, $49 = 0, $5 = 0, $50 = 0.0, $51 = 0, $52 = 0, $53 = 0, $54 = 0, $55 = 0, $56 = 0, $57 = 0.0, $58 = 0.0, $59 = 0.0, $6 = 0, $60 = 0, $61 = 0, $62 = 0;
 var $63 = 0, $64 = 0.0, $65 = 0.0, $66 = 0.0, $67 = 0, $68 = 0, $69 = 0, $7 = 0, $70 = 0, $71 = 0.0, $72 = 0, $73 = 0, $74 = 0, $75 = 0, $8 = 0, $9 = 0, $count = 0, $covariance = 0, $end = 0, $grid = 0;
 var $gridrcp = 0, $half = 0, $i = 0, $max = 0.0, $min = 0.0, $one = 0, $perceptual = 0, $principle = 0, $start = 0, $val = 0.0, $values = 0, $weights = 0, $zero = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 336|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $3 = sp + 304|0;
 $4 = sp + 292|0;
 $covariance = sp + 256|0;
 $principle = sp + 244|0;
 $start = sp + 232|0;
 $end = sp + 220|0;
 $one = sp + 192|0;
 $zero = sp + 180|0;
 $5 = sp + 168|0;
 $6 = sp + 156|0;
 $7 = sp + 144|0;
 $8 = sp + 132|0;
 $grid = sp + 120|0;
 $gridrcp = sp + 108|0;
 $half = sp + 96|0;
 $9 = sp + 84|0;
 $10 = sp + 72|0;
 $11 = sp + 60|0;
 $12 = sp + 48|0;
 $13 = sp + 36|0;
 $14 = sp + 24|0;
 $15 = sp + 12|0;
 $16 = sp;
 $0 = $this;
 $1 = $colours;
 $2 = $flags;
 $17 = $0;
 $18 = $1;
 $19 = $2;
 __ZN6squish9ColourFitC2EPKNS_9ColourSetEi($17,$18,$19);
 $20 = (112 + 8|0);
 HEAP32[$17>>2] = $20;
 $21 = (($17) + 12|0);
 __ZN6squish4Vec3C2Ev($21);
 $22 = (($17) + 24|0);
 __ZN6squish4Vec3C2Ev($22);
 $23 = (($17) + 36|0);
 __ZN6squish4Vec3C2Ev($23);
 $24 = (($17) + 8|0);
 $25 = HEAP32[$24>>2]|0;
 $26 = $25 & 32;
 $27 = ($26|0)!=(0);
 $28 = $27&1;
 $perceptual = $28;
 $29 = $perceptual;
 $30 = $29&1;
 if ($30) {
  $31 = (($17) + 12|0);
  __ZN6squish4Vec3C2Efff($3,0.2125999927520752,0.71520000696182251,0.072200000286102295);
  ;HEAP32[$31+0>>2]=HEAP32[$3+0>>2]|0;HEAP32[$31+4>>2]=HEAP32[$3+4>>2]|0;HEAP32[$31+8>>2]=HEAP32[$3+8>>2]|0;
 } else {
  $32 = (($17) + 12|0);
  __ZN6squish4Vec3C2Ef($4,1.0);
  ;HEAP32[$32+0>>2]=HEAP32[$4+0>>2]|0;HEAP32[$32+4>>2]=HEAP32[$4+4>>2]|0;HEAP32[$32+8>>2]=HEAP32[$4+8>>2]|0;
 }
 $33 = (($17) + 48|0);
 HEAPF32[$33>>2] = 3.4028234663852886E+38;
 $34 = (($17) + 4|0);
 $35 = HEAP32[$34>>2]|0;
 $36 = (__ZNK6squish9ColourSet8GetCountEv($35)|0);
 $count = $36;
 $37 = (($17) + 4|0);
 $38 = HEAP32[$37>>2]|0;
 $39 = (__ZNK6squish9ColourSet9GetPointsEv($38)|0);
 $values = $39;
 $40 = (($17) + 4|0);
 $41 = HEAP32[$40>>2]|0;
 $42 = (__ZNK6squish9ColourSet10GetWeightsEv($41)|0);
 $weights = $42;
 $43 = $count;
 $44 = $values;
 $45 = $weights;
 __ZN6squish25ComputeWeightedCovarianceEiPKNS_4Vec3EPKf($covariance,$43,$44,$45);
 __ZN6squish25ComputePrincipleComponentERKNS_6Sym3x3E($principle,$covariance);
 __ZN6squish4Vec3C2Ef($start,0.0);
 __ZN6squish4Vec3C2Ef($end,0.0);
 $46 = $count;
 $47 = ($46|0)>(0);
 if ($47) {
  $48 = $values;
  ;HEAP32[$end+0>>2]=HEAP32[$48+0>>2]|0;HEAP32[$end+4>>2]=HEAP32[$48+4>>2]|0;HEAP32[$end+8>>2]=HEAP32[$48+8>>2]|0;
  ;HEAP32[$start+0>>2]=HEAP32[$end+0>>2]|0;HEAP32[$start+4>>2]=HEAP32[$end+4>>2]|0;HEAP32[$start+8>>2]=HEAP32[$end+8>>2]|0;
  $49 = $values;
  $50 = (+__ZN6squish3DotERKNS_4Vec3ES2_($49,$principle));
  $max = $50;
  $min = $50;
  $i = 1;
  while(1) {
   $51 = $i;
   $52 = $count;
   $53 = ($51|0)<($52|0);
   if (!($53)) {
    break;
   }
   $54 = $i;
   $55 = $values;
   $56 = (($55) + (($54*12)|0)|0);
   $57 = (+__ZN6squish3DotERKNS_4Vec3ES2_($56,$principle));
   $val = $57;
   $58 = $val;
   $59 = $min;
   $60 = $58 < $59;
   if ($60) {
    $61 = $i;
    $62 = $values;
    $63 = (($62) + (($61*12)|0)|0);
    ;HEAP32[$start+0>>2]=HEAP32[$63+0>>2]|0;HEAP32[$start+4>>2]=HEAP32[$63+4>>2]|0;HEAP32[$start+8>>2]=HEAP32[$63+8>>2]|0;
    $64 = $val;
    $min = $64;
   } else {
    $65 = $val;
    $66 = $max;
    $67 = $65 > $66;
    if ($67) {
     $68 = $i;
     $69 = $values;
     $70 = (($69) + (($68*12)|0)|0);
     ;HEAP32[$end+0>>2]=HEAP32[$70+0>>2]|0;HEAP32[$end+4>>2]=HEAP32[$70+4>>2]|0;HEAP32[$end+8>>2]=HEAP32[$70+8>>2]|0;
     $71 = $val;
     $max = $71;
    }
   }
   $72 = $i;
   $73 = (($72) + 1)|0;
   $i = $73;
  }
 }
 __ZN6squish4Vec3C2Ef($one,1.0);
 __ZN6squish4Vec3C2Ef($zero,0.0);
 __ZN6squish3MaxERKNS_4Vec3ES2_($6,$zero,$start);
 __ZN6squish3MinERKNS_4Vec3ES2_($5,$one,$6);
 ;HEAP32[$start+0>>2]=HEAP32[$5+0>>2]|0;HEAP32[$start+4>>2]=HEAP32[$5+4>>2]|0;HEAP32[$start+8>>2]=HEAP32[$5+8>>2]|0;
 __ZN6squish3MaxERKNS_4Vec3ES2_($8,$zero,$end);
 __ZN6squish3MinERKNS_4Vec3ES2_($7,$one,$8);
 ;HEAP32[$end+0>>2]=HEAP32[$7+0>>2]|0;HEAP32[$end+4>>2]=HEAP32[$7+4>>2]|0;HEAP32[$end+8>>2]=HEAP32[$7+8>>2]|0;
 __ZN6squish4Vec3C2Efff($grid,31.0,63.0,31.0);
 __ZN6squish4Vec3C2Efff($gridrcp,0.032258063554763794,0.01587301678955555,0.032258063554763794);
 __ZN6squish4Vec3C2Ef($half,0.5);
 $74 = (($17) + 24|0);
 __ZN6squishmlERKNS_4Vec3ES2_($12,$grid,$start);
 __ZN6squishplERKNS_4Vec3ES2_($11,$12,$half);
 __ZN6squish8TruncateERKNS_4Vec3E($10,$11);
 __ZN6squishmlERKNS_4Vec3ES2_($9,$10,$gridrcp);
 ;HEAP32[$74+0>>2]=HEAP32[$9+0>>2]|0;HEAP32[$74+4>>2]=HEAP32[$9+4>>2]|0;HEAP32[$74+8>>2]=HEAP32[$9+8>>2]|0;
 $75 = (($17) + 36|0);
 __ZN6squishmlERKNS_4Vec3ES2_($16,$grid,$end);
 __ZN6squishplERKNS_4Vec3ES2_($15,$16,$half);
 __ZN6squish8TruncateERKNS_4Vec3E($14,$15);
 __ZN6squishmlERKNS_4Vec3ES2_($13,$14,$gridrcp);
 ;HEAP32[$75+0>>2]=HEAP32[$13+0>>2]|0;HEAP32[$75+4>>2]=HEAP32[$13+4>>2]|0;HEAP32[$75+8>>2]=HEAP32[$13+8>>2]|0;
 STACKTOP = sp;return;
}
function __ZN6squish8RangeFit9Compress3EPv($this,$block) {
 $this = $this|0;
 $block = $block|0;
 var $0 = 0, $1 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $2 = 0, $20 = 0, $21 = 0, $22 = 0, $23 = 0, $24 = 0, $25 = 0, $26 = 0;
 var $27 = 0, $28 = 0, $29 = 0, $3 = 0, $30 = 0, $31 = 0, $32 = 0, $33 = 0, $34 = 0, $35 = 0.0, $36 = 0.0, $37 = 0.0, $38 = 0, $39 = 0.0, $4 = 0, $40 = 0, $41 = 0, $42 = 0, $43 = 0, $44 = 0;
 var $45 = 0, $46 = 0, $47 = 0.0, $48 = 0.0, $49 = 0.0, $5 = 0, $50 = 0, $51 = 0, $52 = 0.0, $53 = 0, $54 = 0.0, $55 = 0, $56 = 0, $57 = 0, $58 = 0, $59 = 0, $6 = 0, $60 = 0, $61 = 0.0, $62 = 0;
 var $7 = 0, $8 = 0, $9 = 0, $closest = 0, $codes = 0, $count = 0, $d = 0.0, $dist = 0.0, $error = 0.0, $i = 0, $idx = 0, $indices = 0, $j = 0, $values = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 176|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $codes = sp + 84|0;
 $2 = sp + 72|0;
 $3 = sp + 60|0;
 $4 = sp + 48|0;
 $closest = sp + 152|0;
 $5 = sp + 12|0;
 $6 = sp;
 $indices = sp + 136|0;
 $0 = $this;
 $1 = $block;
 $7 = $0;
 $8 = (($7) + 4|0);
 $9 = HEAP32[$8>>2]|0;
 $10 = (__ZNK6squish9ColourSet8GetCountEv($9)|0);
 $count = $10;
 $11 = (($7) + 4|0);
 $12 = HEAP32[$11>>2]|0;
 $13 = (__ZNK6squish9ColourSet9GetPointsEv($12)|0);
 $values = $13;
 $14 = (($codes) + 36|0);
 $15 = $codes;
 while(1) {
  __ZN6squish4Vec3C2Ev($15);
  $16 = (($15) + 12|0);
  $17 = ($16|0)==($14|0);
  if ($17) {
   break;
  } else {
   $15 = $16;
  }
 }
 $18 = (($7) + 24|0);
 ;HEAP32[$codes+0>>2]=HEAP32[$18+0>>2]|0;HEAP32[$codes+4>>2]=HEAP32[$18+4>>2]|0;HEAP32[$codes+8>>2]=HEAP32[$18+8>>2]|0;
 $19 = (($codes) + 12|0);
 $20 = (($7) + 36|0);
 ;HEAP32[$19+0>>2]=HEAP32[$20+0>>2]|0;HEAP32[$19+4>>2]=HEAP32[$20+4>>2]|0;HEAP32[$19+8>>2]=HEAP32[$20+8>>2]|0;
 $21 = (($codes) + 24|0);
 $22 = (($7) + 24|0);
 __ZN6squishmlEfRKNS_4Vec3E($3,0.5,$22);
 $23 = (($7) + 36|0);
 __ZN6squishmlEfRKNS_4Vec3E($4,0.5,$23);
 __ZN6squishplERKNS_4Vec3ES2_($2,$3,$4);
 ;HEAP32[$21+0>>2]=HEAP32[$2+0>>2]|0;HEAP32[$21+4>>2]=HEAP32[$2+4>>2]|0;HEAP32[$21+8>>2]=HEAP32[$2+8>>2]|0;
 $error = 0.0;
 $i = 0;
 while(1) {
  $24 = $i;
  $25 = $count;
  $26 = ($24|0)<($25|0);
  if (!($26)) {
   break;
  }
  $dist = 3.4028234663852886E+38;
  $idx = 0;
  $j = 0;
  while(1) {
   $27 = $j;
   $28 = ($27|0)<(3);
   if (!($28)) {
    break;
   }
   $29 = (($7) + 12|0);
   $30 = $i;
   $31 = $values;
   $32 = (($31) + (($30*12)|0)|0);
   $33 = $j;
   $34 = (($codes) + (($33*12)|0)|0);
   __ZN6squishmiERKNS_4Vec3ES2_($6,$32,$34);
   __ZN6squishmlERKNS_4Vec3ES2_($5,$29,$6);
   $35 = (+__ZN6squish13LengthSquaredERKNS_4Vec3E($5));
   $d = $35;
   $36 = $d;
   $37 = $dist;
   $38 = $36 < $37;
   if ($38) {
    $39 = $d;
    $dist = $39;
    $40 = $j;
    $idx = $40;
   }
   $41 = $j;
   $42 = (($41) + 1)|0;
   $j = $42;
  }
  $43 = $idx;
  $44 = $43&255;
  $45 = $i;
  $46 = (($closest) + ($45)|0);
  HEAP8[$46>>0] = $44;
  $47 = $dist;
  $48 = $error;
  $49 = $48 + $47;
  $error = $49;
  $50 = $i;
  $51 = (($50) + 1)|0;
  $i = $51;
 }
 $52 = $error;
 $53 = (($7) + 48|0);
 $54 = +HEAPF32[$53>>2];
 $55 = $52 < $54;
 if (!($55)) {
  STACKTOP = sp;return;
 }
 $56 = (($7) + 4|0);
 $57 = HEAP32[$56>>2]|0;
 __ZNK6squish9ColourSet12RemapIndicesEPKhPh($57,$closest,$indices);
 $58 = (($7) + 24|0);
 $59 = (($7) + 36|0);
 $60 = $1;
 __ZN6squish17WriteColourBlock3ERKNS_4Vec3ES2_PKhPv($58,$59,$indices,$60);
 $61 = $error;
 $62 = (($7) + 48|0);
 HEAPF32[$62>>2] = $61;
 STACKTOP = sp;return;
}
function __ZN6squish8RangeFit9Compress4EPv($this,$block) {
 $this = $this|0;
 $block = $block|0;
 var $0 = 0, $1 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $2 = 0, $20 = 0, $21 = 0, $22 = 0, $23 = 0, $24 = 0, $25 = 0, $26 = 0;
 var $27 = 0, $28 = 0, $29 = 0, $3 = 0, $30 = 0, $31 = 0, $32 = 0, $33 = 0, $34 = 0, $35 = 0, $36 = 0, $37 = 0, $38 = 0, $39 = 0, $4 = 0, $40 = 0, $41 = 0.0, $42 = 0.0, $43 = 0.0, $44 = 0;
 var $45 = 0.0, $46 = 0, $47 = 0, $48 = 0, $49 = 0, $5 = 0, $50 = 0, $51 = 0, $52 = 0, $53 = 0.0, $54 = 0.0, $55 = 0.0, $56 = 0, $57 = 0, $58 = 0.0, $59 = 0, $6 = 0, $60 = 0.0, $61 = 0, $62 = 0;
 var $63 = 0, $64 = 0, $65 = 0, $66 = 0, $67 = 0.0, $68 = 0, $7 = 0, $8 = 0, $9 = 0, $closest = 0, $codes = 0, $count = 0, $d = 0.0, $dist = 0.0, $error = 0.0, $i = 0, $idx = 0, $indices = 0, $j = 0, $values = 0;
 var label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 224|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $codes = sp + 120|0;
 $2 = sp + 108|0;
 $3 = sp + 96|0;
 $4 = sp + 84|0;
 $5 = sp + 72|0;
 $6 = sp + 60|0;
 $7 = sp + 48|0;
 $closest = sp + 200|0;
 $8 = sp + 12|0;
 $9 = sp;
 $indices = sp + 184|0;
 $0 = $this;
 $1 = $block;
 $10 = $0;
 $11 = (($10) + 4|0);
 $12 = HEAP32[$11>>2]|0;
 $13 = (__ZNK6squish9ColourSet8GetCountEv($12)|0);
 $count = $13;
 $14 = (($10) + 4|0);
 $15 = HEAP32[$14>>2]|0;
 $16 = (__ZNK6squish9ColourSet9GetPointsEv($15)|0);
 $values = $16;
 $17 = (($codes) + 48|0);
 $18 = $codes;
 while(1) {
  __ZN6squish4Vec3C2Ev($18);
  $19 = (($18) + 12|0);
  $20 = ($19|0)==($17|0);
  if ($20) {
   break;
  } else {
   $18 = $19;
  }
 }
 $21 = (($10) + 24|0);
 ;HEAP32[$codes+0>>2]=HEAP32[$21+0>>2]|0;HEAP32[$codes+4>>2]=HEAP32[$21+4>>2]|0;HEAP32[$codes+8>>2]=HEAP32[$21+8>>2]|0;
 $22 = (($codes) + 12|0);
 $23 = (($10) + 36|0);
 ;HEAP32[$22+0>>2]=HEAP32[$23+0>>2]|0;HEAP32[$22+4>>2]=HEAP32[$23+4>>2]|0;HEAP32[$22+8>>2]=HEAP32[$23+8>>2]|0;
 $24 = (($codes) + 24|0);
 $25 = (($10) + 24|0);
 __ZN6squishmlEfRKNS_4Vec3E($3,0.66666668653488159,$25);
 $26 = (($10) + 36|0);
 __ZN6squishmlEfRKNS_4Vec3E($4,0.3333333432674408,$26);
 __ZN6squishplERKNS_4Vec3ES2_($2,$3,$4);
 ;HEAP32[$24+0>>2]=HEAP32[$2+0>>2]|0;HEAP32[$24+4>>2]=HEAP32[$2+4>>2]|0;HEAP32[$24+8>>2]=HEAP32[$2+8>>2]|0;
 $27 = (($codes) + 36|0);
 $28 = (($10) + 24|0);
 __ZN6squishmlEfRKNS_4Vec3E($6,0.3333333432674408,$28);
 $29 = (($10) + 36|0);
 __ZN6squishmlEfRKNS_4Vec3E($7,0.66666668653488159,$29);
 __ZN6squishplERKNS_4Vec3ES2_($5,$6,$7);
 ;HEAP32[$27+0>>2]=HEAP32[$5+0>>2]|0;HEAP32[$27+4>>2]=HEAP32[$5+4>>2]|0;HEAP32[$27+8>>2]=HEAP32[$5+8>>2]|0;
 $error = 0.0;
 $i = 0;
 while(1) {
  $30 = $i;
  $31 = $count;
  $32 = ($30|0)<($31|0);
  if (!($32)) {
   break;
  }
  $dist = 3.4028234663852886E+38;
  $idx = 0;
  $j = 0;
  while(1) {
   $33 = $j;
   $34 = ($33|0)<(4);
   if (!($34)) {
    break;
   }
   $35 = (($10) + 12|0);
   $36 = $i;
   $37 = $values;
   $38 = (($37) + (($36*12)|0)|0);
   $39 = $j;
   $40 = (($codes) + (($39*12)|0)|0);
   __ZN6squishmiERKNS_4Vec3ES2_($9,$38,$40);
   __ZN6squishmlERKNS_4Vec3ES2_($8,$35,$9);
   $41 = (+__ZN6squish13LengthSquaredERKNS_4Vec3E($8));
   $d = $41;
   $42 = $d;
   $43 = $dist;
   $44 = $42 < $43;
   if ($44) {
    $45 = $d;
    $dist = $45;
    $46 = $j;
    $idx = $46;
   }
   $47 = $j;
   $48 = (($47) + 1)|0;
   $j = $48;
  }
  $49 = $idx;
  $50 = $49&255;
  $51 = $i;
  $52 = (($closest) + ($51)|0);
  HEAP8[$52>>0] = $50;
  $53 = $dist;
  $54 = $error;
  $55 = $54 + $53;
  $error = $55;
  $56 = $i;
  $57 = (($56) + 1)|0;
  $i = $57;
 }
 $58 = $error;
 $59 = (($10) + 48|0);
 $60 = +HEAPF32[$59>>2];
 $61 = $58 < $60;
 if (!($61)) {
  STACKTOP = sp;return;
 }
 $62 = (($10) + 4|0);
 $63 = HEAP32[$62>>2]|0;
 __ZNK6squish9ColourSet12RemapIndicesEPKhPh($63,$closest,$indices);
 $64 = (($10) + 24|0);
 $65 = (($10) + 36|0);
 $66 = $1;
 __ZN6squish17WriteColourBlock4ERKNS_4Vec3ES2_PKhPv($64,$65,$indices,$66);
 $67 = $error;
 $68 = (($10) + 48|0);
 HEAPF32[$68>>2] = $67;
 STACKTOP = sp;return;
}
function __ZN6squish3MaxERKNS_4Vec3ES2_($agg$result,$left,$right) {
 $agg$result = $agg$result|0;
 $left = $left|0;
 $right = $right|0;
 var $0 = 0, $1 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $2 = 0, $20 = 0, $21 = 0, $22 = 0, $23 = 0, $24 = 0, $25 = 0, $26 = 0;
 var $27 = 0, $28 = 0, $29 = 0, $3 = 0, $30 = 0, $31 = 0, $32 = 0, $33 = 0, $34 = 0, $35 = 0, $36 = 0.0, $37 = 0, $38 = 0.0, $39 = 0, $4 = 0, $40 = 0, $41 = 0, $42 = 0.0, $43 = 0, $44 = 0;
 var $45 = 0, $46 = 0, $47 = 0, $48 = 0, $49 = 0, $5 = 0, $50 = 0, $51 = 0, $52 = 0, $53 = 0.0, $54 = 0, $55 = 0.0, $56 = 0, $57 = 0, $58 = 0, $59 = 0.0, $6 = 0, $60 = 0, $61 = 0, $62 = 0;
 var $63 = 0, $64 = 0, $65 = 0, $66 = 0, $67 = 0, $68 = 0, $69 = 0, $7 = 0, $70 = 0.0, $71 = 0, $72 = 0.0, $73 = 0, $74 = 0, $75 = 0, $76 = 0.0, $77 = 0, $8 = 0, $9 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 128|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $5 = sp + 16|0;
 $8 = sp + 114|0;
 $14 = sp + 8|0;
 $17 = sp + 113|0;
 $23 = sp;
 $26 = sp + 112|0;
 $27 = $left;
 $28 = $right;
 $29 = $27;
 $30 = $28;
 $24 = $29;
 $25 = $30;
 $31 = $24;
 $32 = $25;
 ;HEAP8[$23+0>>0]=HEAP8[$26+0>>0]|0;
 $21 = $31;
 $22 = $32;
 $33 = $21;
 $34 = $22;
 $18 = $23;
 $19 = $33;
 $20 = $34;
 $35 = $19;
 $36 = +HEAPF32[$35>>2];
 $37 = $20;
 $38 = +HEAPF32[$37>>2];
 $39 = $36 < $38;
 if ($39) {
  $40 = $22;
  $43 = $40;
 } else {
  $41 = $21;
  $43 = $41;
 }
 $42 = +HEAPF32[$43>>2];
 $44 = $27;
 $45 = (($44) + 4|0);
 $46 = $28;
 $47 = (($46) + 4|0);
 $15 = $45;
 $16 = $47;
 $48 = $15;
 $49 = $16;
 ;HEAP8[$14+0>>0]=HEAP8[$17+0>>0]|0;
 $12 = $48;
 $13 = $49;
 $50 = $12;
 $51 = $13;
 $9 = $14;
 $10 = $50;
 $11 = $51;
 $52 = $10;
 $53 = +HEAPF32[$52>>2];
 $54 = $11;
 $55 = +HEAPF32[$54>>2];
 $56 = $53 < $55;
 if ($56) {
  $57 = $13;
  $60 = $57;
 } else {
  $58 = $12;
  $60 = $58;
 }
 $59 = +HEAPF32[$60>>2];
 $61 = $27;
 $62 = (($61) + 8|0);
 $63 = $28;
 $64 = (($63) + 8|0);
 $6 = $62;
 $7 = $64;
 $65 = $6;
 $66 = $7;
 ;HEAP8[$5+0>>0]=HEAP8[$8+0>>0]|0;
 $3 = $65;
 $4 = $66;
 $67 = $3;
 $68 = $4;
 $0 = $5;
 $1 = $67;
 $2 = $68;
 $69 = $1;
 $70 = +HEAPF32[$69>>2];
 $71 = $2;
 $72 = +HEAPF32[$71>>2];
 $73 = $70 < $72;
 if ($73) {
  $74 = $4;
  $77 = $74;
  $76 = +HEAPF32[$77>>2];
  __ZN6squish4Vec3C2Efff($agg$result,$42,$59,$76);
  STACKTOP = sp;return;
 } else {
  $75 = $3;
  $77 = $75;
  $76 = +HEAPF32[$77>>2];
  __ZN6squish4Vec3C2Efff($agg$result,$42,$59,$76);
  STACKTOP = sp;return;
 }
}
function __ZN6squish3MinERKNS_4Vec3ES2_($agg$result,$left,$right) {
 $agg$result = $agg$result|0;
 $left = $left|0;
 $right = $right|0;
 var $0 = 0, $1 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $2 = 0, $20 = 0, $21 = 0, $22 = 0, $23 = 0, $24 = 0, $25 = 0, $26 = 0;
 var $27 = 0, $28 = 0, $29 = 0, $3 = 0, $30 = 0, $31 = 0, $32 = 0, $33 = 0, $34 = 0, $35 = 0, $36 = 0.0, $37 = 0, $38 = 0.0, $39 = 0, $4 = 0, $40 = 0, $41 = 0, $42 = 0.0, $43 = 0, $44 = 0;
 var $45 = 0, $46 = 0, $47 = 0, $48 = 0, $49 = 0, $5 = 0, $50 = 0, $51 = 0, $52 = 0, $53 = 0.0, $54 = 0, $55 = 0.0, $56 = 0, $57 = 0, $58 = 0, $59 = 0.0, $6 = 0, $60 = 0, $61 = 0, $62 = 0;
 var $63 = 0, $64 = 0, $65 = 0, $66 = 0, $67 = 0, $68 = 0, $69 = 0, $7 = 0, $70 = 0.0, $71 = 0, $72 = 0.0, $73 = 0, $74 = 0, $75 = 0, $76 = 0.0, $77 = 0, $8 = 0, $9 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 128|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $5 = sp + 16|0;
 $8 = sp + 114|0;
 $14 = sp + 8|0;
 $17 = sp + 113|0;
 $23 = sp;
 $26 = sp + 112|0;
 $27 = $left;
 $28 = $right;
 $29 = $27;
 $30 = $28;
 $24 = $29;
 $25 = $30;
 $31 = $24;
 $32 = $25;
 ;HEAP8[$23+0>>0]=HEAP8[$26+0>>0]|0;
 $21 = $31;
 $22 = $32;
 $33 = $22;
 $34 = $21;
 $18 = $23;
 $19 = $33;
 $20 = $34;
 $35 = $19;
 $36 = +HEAPF32[$35>>2];
 $37 = $20;
 $38 = +HEAPF32[$37>>2];
 $39 = $36 < $38;
 if ($39) {
  $40 = $22;
  $43 = $40;
 } else {
  $41 = $21;
  $43 = $41;
 }
 $42 = +HEAPF32[$43>>2];
 $44 = $27;
 $45 = (($44) + 4|0);
 $46 = $28;
 $47 = (($46) + 4|0);
 $15 = $45;
 $16 = $47;
 $48 = $15;
 $49 = $16;
 ;HEAP8[$14+0>>0]=HEAP8[$17+0>>0]|0;
 $12 = $48;
 $13 = $49;
 $50 = $13;
 $51 = $12;
 $9 = $14;
 $10 = $50;
 $11 = $51;
 $52 = $10;
 $53 = +HEAPF32[$52>>2];
 $54 = $11;
 $55 = +HEAPF32[$54>>2];
 $56 = $53 < $55;
 if ($56) {
  $57 = $13;
  $60 = $57;
 } else {
  $58 = $12;
  $60 = $58;
 }
 $59 = +HEAPF32[$60>>2];
 $61 = $27;
 $62 = (($61) + 8|0);
 $63 = $28;
 $64 = (($63) + 8|0);
 $6 = $62;
 $7 = $64;
 $65 = $6;
 $66 = $7;
 ;HEAP8[$5+0>>0]=HEAP8[$8+0>>0]|0;
 $3 = $65;
 $4 = $66;
 $67 = $4;
 $68 = $3;
 $0 = $5;
 $1 = $67;
 $2 = $68;
 $69 = $1;
 $70 = +HEAPF32[$69>>2];
 $71 = $2;
 $72 = +HEAPF32[$71>>2];
 $73 = $70 < $72;
 if ($73) {
  $74 = $4;
  $77 = $74;
  $76 = +HEAPF32[$77>>2];
  __ZN6squish4Vec3C2Efff($agg$result,$42,$59,$76);
  STACKTOP = sp;return;
 } else {
  $75 = $3;
  $77 = $75;
  $76 = +HEAPF32[$77>>2];
  __ZN6squish4Vec3C2Efff($agg$result,$42,$59,$76);
  STACKTOP = sp;return;
 }
}
function __ZN6squishmlERKNS_4Vec3ES2_($agg$result,$left,$right) {
 $agg$result = $agg$result|0;
 $left = $left|0;
 $right = $right|0;
 var $0 = 0, $1 = 0, $2 = 0, $3 = 0, $4 = 0, $copy = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 32|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $copy = sp;
 $0 = $left;
 $1 = $right;
 $2 = $0;
 ;HEAP32[$copy+0>>2]=HEAP32[$2+0>>2]|0;HEAP32[$copy+4>>2]=HEAP32[$2+4>>2]|0;HEAP32[$copy+8>>2]=HEAP32[$2+8>>2]|0;
 $3 = $1;
 $4 = (__ZN6squish4Vec3mLERKS0_($copy,$3)|0);
 ;HEAP32[$agg$result+0>>2]=HEAP32[$4+0>>2]|0;HEAP32[$agg$result+4>>2]=HEAP32[$4+4>>2]|0;HEAP32[$agg$result+8>>2]=HEAP32[$4+8>>2]|0;
 STACKTOP = sp;return;
}
function __ZN6squishplERKNS_4Vec3ES2_($agg$result,$left,$right) {
 $agg$result = $agg$result|0;
 $left = $left|0;
 $right = $right|0;
 var $0 = 0, $1 = 0, $2 = 0, $3 = 0, $4 = 0, $copy = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 32|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $copy = sp;
 $0 = $left;
 $1 = $right;
 $2 = $0;
 ;HEAP32[$copy+0>>2]=HEAP32[$2+0>>2]|0;HEAP32[$copy+4>>2]=HEAP32[$2+4>>2]|0;HEAP32[$copy+8>>2]=HEAP32[$2+8>>2]|0;
 $3 = $1;
 $4 = (__ZN6squish4Vec3pLERKS0_($copy,$3)|0);
 ;HEAP32[$agg$result+0>>2]=HEAP32[$4+0>>2]|0;HEAP32[$agg$result+4>>2]=HEAP32[$4+4>>2]|0;HEAP32[$agg$result+8>>2]=HEAP32[$4+8>>2]|0;
 STACKTOP = sp;return;
}
function __ZN6squish8TruncateERKNS_4Vec3E($agg$result,$v) {
 $agg$result = $agg$result|0;
 $v = $v|0;
 var $0 = 0.0, $1 = 0.0, $10 = 0, $11 = 0.0, $12 = 0.0, $13 = 0.0, $14 = 0, $15 = 0.0, $16 = 0.0, $17 = 0.0, $18 = 0, $19 = 0, $2 = 0.0, $20 = 0.0, $21 = 0, $22 = 0, $23 = 0, $24 = 0.0, $25 = 0.0, $26 = 0.0;
 var $27 = 0, $28 = 0, $29 = 0.0, $3 = 0.0, $30 = 0.0, $31 = 0.0, $32 = 0, $33 = 0, $34 = 0.0, $35 = 0, $36 = 0, $37 = 0, $38 = 0.0, $39 = 0.0, $4 = 0.0, $40 = 0.0, $41 = 0, $42 = 0, $43 = 0.0, $44 = 0.0;
 var $45 = 0.0, $46 = 0.0, $47 = 0.0, $48 = 0.0, $5 = 0.0, $6 = 0, $7 = 0, $8 = 0.0, $9 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 32|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $6 = $v;
 $7 = $6;
 $8 = +HEAPF32[$7>>2];
 $9 = $8 > 0.0;
 if ($9) {
  $10 = $6;
  $11 = +HEAPF32[$10>>2];
  $5 = $11;
  $12 = $5;
  $13 = (+Math_floor((+$12)));
  $46 = $13;
 } else {
  $14 = $6;
  $15 = +HEAPF32[$14>>2];
  $4 = $15;
  $16 = $4;
  $17 = (+Math_ceil((+$16)));
  $46 = $17;
 }
 $18 = $6;
 $19 = (($18) + 4|0);
 $20 = +HEAPF32[$19>>2];
 $21 = $20 > 0.0;
 if ($21) {
  $22 = $6;
  $23 = (($22) + 4|0);
  $24 = +HEAPF32[$23>>2];
  $3 = $24;
  $25 = $3;
  $26 = (+Math_floor((+$25)));
  $47 = $26;
 } else {
  $27 = $6;
  $28 = (($27) + 4|0);
  $29 = +HEAPF32[$28>>2];
  $2 = $29;
  $30 = $2;
  $31 = (+Math_ceil((+$30)));
  $47 = $31;
 }
 $32 = $6;
 $33 = (($32) + 8|0);
 $34 = +HEAPF32[$33>>2];
 $35 = $34 > 0.0;
 if ($35) {
  $36 = $6;
  $37 = (($36) + 8|0);
  $38 = +HEAPF32[$37>>2];
  $1 = $38;
  $39 = $1;
  $40 = (+Math_floor((+$39)));
  $48 = $40;
  __ZN6squish4Vec3C2Efff($agg$result,$46,$47,$48);
  STACKTOP = sp;return;
 } else {
  $41 = $6;
  $42 = (($41) + 8|0);
  $43 = +HEAPF32[$42>>2];
  $0 = $43;
  $44 = $0;
  $45 = (+Math_ceil((+$44)));
  $48 = $45;
  __ZN6squish4Vec3C2Efff($agg$result,$46,$47,$48);
  STACKTOP = sp;return;
 }
}
function __ZN6squish13LengthSquaredERKNS_4Vec3E($v) {
 $v = $v|0;
 var $0 = 0, $1 = 0, $2 = 0, $3 = 0.0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $0 = $v;
 $1 = $0;
 $2 = $0;
 $3 = (+__ZN6squish3DotERKNS_4Vec3ES2_($1,$2));
 STACKTOP = sp;return (+$3);
}
function __ZN6squish4Vec3mLERKS0_($this,$v) {
 $this = $this|0;
 $v = $v|0;
 var $0 = 0, $1 = 0, $10 = 0, $11 = 0.0, $12 = 0.0, $13 = 0, $14 = 0, $15 = 0.0, $16 = 0, $17 = 0.0, $18 = 0.0, $2 = 0, $3 = 0, $4 = 0.0, $5 = 0.0, $6 = 0.0, $7 = 0, $8 = 0, $9 = 0.0, label = 0;
 var sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $0 = $this;
 $1 = $v;
 $2 = $0;
 $3 = $1;
 $4 = +HEAPF32[$3>>2];
 $5 = +HEAPF32[$2>>2];
 $6 = $5 * $4;
 HEAPF32[$2>>2] = $6;
 $7 = $1;
 $8 = (($7) + 4|0);
 $9 = +HEAPF32[$8>>2];
 $10 = (($2) + 4|0);
 $11 = +HEAPF32[$10>>2];
 $12 = $11 * $9;
 HEAPF32[$10>>2] = $12;
 $13 = $1;
 $14 = (($13) + 8|0);
 $15 = +HEAPF32[$14>>2];
 $16 = (($2) + 8|0);
 $17 = +HEAPF32[$16>>2];
 $18 = $17 * $15;
 HEAPF32[$16>>2] = $18;
 STACKTOP = sp;return ($2|0);
}
function __ZN6squish15SingleColourFitC2EPKNS_9ColourSetEi($this,$colours,$flags) {
 $this = $this|0;
 $colours = $colours|0;
 $flags = $flags|0;
 var $0 = 0, $1 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0.0, $14 = 0.0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0.0, $2 = 0, $20 = 0.0, $21 = 0, $22 = 0, $23 = 0, $24 = 0, $25 = 0, $26 = 0.0;
 var $27 = 0.0, $28 = 0, $29 = 0, $3 = 0, $30 = 0, $31 = 0, $32 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, $values = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $0 = $this;
 $1 = $colours;
 $2 = $flags;
 $3 = $0;
 $4 = $1;
 $5 = $2;
 __ZN6squish9ColourFitC2EPKNS_9ColourSetEi($3,$4,$5);
 $6 = (168 + 8|0);
 HEAP32[$3>>2] = $6;
 $7 = (($3) + 16|0);
 __ZN6squish4Vec3C2Ev($7);
 $8 = (($3) + 28|0);
 __ZN6squish4Vec3C2Ev($8);
 $9 = (($3) + 4|0);
 $10 = HEAP32[$9>>2]|0;
 $11 = (__ZNK6squish9ColourSet9GetPointsEv($10)|0);
 $values = $11;
 $12 = $values;
 $13 = (+__ZNK6squish4Vec31XEv($12));
 $14 = 255.0 * $13;
 $15 = (__ZN6squishL10FloatToIntEfi14($14,255)|0);
 $16 = $15&255;
 $17 = (($3) + 12|0);
 HEAP8[$17>>0] = $16;
 $18 = $values;
 $19 = (+__ZNK6squish4Vec31YEv($18));
 $20 = 255.0 * $19;
 $21 = (__ZN6squishL10FloatToIntEfi14($20,255)|0);
 $22 = $21&255;
 $23 = (($3) + 12|0);
 $24 = (($23) + 1|0);
 HEAP8[$24>>0] = $22;
 $25 = $values;
 $26 = (+__ZNK6squish4Vec31ZEv($25));
 $27 = 255.0 * $26;
 $28 = (__ZN6squishL10FloatToIntEfi14($27,255)|0);
 $29 = $28&255;
 $30 = (($3) + 12|0);
 $31 = (($30) + 2|0);
 HEAP8[$31>>0] = $29;
 $32 = (($3) + 48|0);
 HEAP32[$32>>2] = 2147483647;
 STACKTOP = sp;return;
}
function __ZN6squish15SingleColourFit9Compress3EPv($this,$block) {
 $this = $this|0;
 $block = $block|0;
 var $0 = 0, $1 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $2 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, $indices = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 32|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $indices = sp + 8|0;
 $0 = $this;
 $1 = $block;
 $2 = $0;
 __ZN6squish15SingleColourFit16ComputeEndPointsEPKPKNS_18SingleColourLookupE($2,184);
 $3 = (($2) + 44|0);
 $4 = HEAP32[$3>>2]|0;
 $5 = (($2) + 48|0);
 $6 = HEAP32[$5>>2]|0;
 $7 = ($4|0)<($6|0);
 if (!($7)) {
  STACKTOP = sp;return;
 }
 $8 = (($2) + 4|0);
 $9 = HEAP32[$8>>2]|0;
 $10 = (($2) + 40|0);
 __ZNK6squish9ColourSet12RemapIndicesEPKhPh($9,$10,$indices);
 $11 = (($2) + 16|0);
 $12 = (($2) + 28|0);
 $13 = $1;
 __ZN6squish17WriteColourBlock3ERKNS_4Vec3ES2_PKhPv($11,$12,$indices,$13);
 $14 = (($2) + 44|0);
 $15 = HEAP32[$14>>2]|0;
 $16 = (($2) + 48|0);
 HEAP32[$16>>2] = $15;
 STACKTOP = sp;return;
}
function __ZN6squish15SingleColourFit16ComputeEndPointsEPKPKNS_18SingleColourLookupE($this,$lookups) {
 $this = $this|0;
 $lookups = $lookups|0;
 var $0 = 0, $1 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $2 = 0, $20 = 0, $21 = 0, $22 = 0, $23 = 0, $24 = 0, $25 = 0, $26 = 0;
 var $27 = 0, $28 = 0, $29 = 0, $3 = 0, $30 = 0, $31 = 0, $32 = 0, $33 = 0, $34 = 0, $35 = 0, $36 = 0, $37 = 0, $38 = 0, $39 = 0, $4 = 0, $40 = 0, $41 = 0, $42 = 0, $43 = 0, $44 = 0;
 var $45 = 0, $46 = 0.0, $47 = 0.0, $48 = 0, $49 = 0, $5 = 0, $50 = 0, $51 = 0.0, $52 = 0.0, $53 = 0, $54 = 0, $55 = 0, $56 = 0.0, $57 = 0.0, $58 = 0, $59 = 0, $6 = 0, $60 = 0, $61 = 0, $62 = 0.0;
 var $63 = 0.0, $64 = 0, $65 = 0, $66 = 0, $67 = 0, $68 = 0.0, $69 = 0.0, $7 = 0, $70 = 0, $71 = 0, $72 = 0, $73 = 0, $74 = 0.0, $75 = 0.0, $76 = 0, $77 = 0, $78 = 0, $79 = 0, $8 = 0, $80 = 0;
 var $81 = 0, $82 = 0, $83 = 0, $9 = 0, $channel = 0, $diff = 0, $error = 0, $index = 0, $lookup = 0, $sources = 0, $target = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 80|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $sources = sp + 44|0;
 $2 = sp + 12|0;
 $3 = sp;
 $0 = $this;
 $1 = $lookups;
 $4 = $0;
 $5 = (($4) + 44|0);
 HEAP32[$5>>2] = 2147483647;
 $index = 0;
 while(1) {
  $6 = $index;
  $7 = ($6|0)<(2);
  if (!($7)) {
   break;
  }
  $error = 0;
  $channel = 0;
  while(1) {
   $8 = $channel;
   $9 = ($8|0)<(3);
   if (!($9)) {
    break;
   }
   $10 = $channel;
   $11 = $1;
   $12 = (($11) + ($10<<2)|0);
   $13 = HEAP32[$12>>2]|0;
   $lookup = $13;
   $14 = $channel;
   $15 = (($4) + 12|0);
   $16 = (($15) + ($14)|0);
   $17 = HEAP8[$16>>0]|0;
   $18 = $17&255;
   $target = $18;
   $19 = $target;
   $20 = $lookup;
   $21 = (($20) + (($19*6)|0)|0);
   $22 = $index;
   $23 = (($21) + (($22*3)|0)|0);
   $24 = $channel;
   $25 = (($sources) + ($24<<2)|0);
   HEAP32[$25>>2] = $23;
   $26 = $channel;
   $27 = (($sources) + ($26<<2)|0);
   $28 = HEAP32[$27>>2]|0;
   $29 = (($28) + 2|0);
   $30 = HEAP8[$29>>0]|0;
   $31 = $30&255;
   $diff = $31;
   $32 = $diff;
   $33 = $diff;
   $34 = Math_imul($32, $33)|0;
   $35 = $error;
   $36 = (($35) + ($34))|0;
   $error = $36;
   $37 = $channel;
   $38 = (($37) + 1)|0;
   $channel = $38;
  }
  $39 = $error;
  $40 = (($4) + 44|0);
  $41 = HEAP32[$40>>2]|0;
  $42 = ($39|0)<($41|0);
  if ($42) {
   $43 = (($4) + 16|0);
   $44 = HEAP32[$sources>>2]|0;
   $45 = HEAP8[$44>>0]|0;
   $46 = (+($45&255));
   $47 = $46 / 31.0;
   $48 = (($sources) + 4|0);
   $49 = HEAP32[$48>>2]|0;
   $50 = HEAP8[$49>>0]|0;
   $51 = (+($50&255));
   $52 = $51 / 63.0;
   $53 = (($sources) + 8|0);
   $54 = HEAP32[$53>>2]|0;
   $55 = HEAP8[$54>>0]|0;
   $56 = (+($55&255));
   $57 = $56 / 31.0;
   __ZN6squish4Vec3C2Efff($2,$47,$52,$57);
   ;HEAP32[$43+0>>2]=HEAP32[$2+0>>2]|0;HEAP32[$43+4>>2]=HEAP32[$2+4>>2]|0;HEAP32[$43+8>>2]=HEAP32[$2+8>>2]|0;
   $58 = (($4) + 28|0);
   $59 = HEAP32[$sources>>2]|0;
   $60 = (($59) + 1|0);
   $61 = HEAP8[$60>>0]|0;
   $62 = (+($61&255));
   $63 = $62 / 31.0;
   $64 = (($sources) + 4|0);
   $65 = HEAP32[$64>>2]|0;
   $66 = (($65) + 1|0);
   $67 = HEAP8[$66>>0]|0;
   $68 = (+($67&255));
   $69 = $68 / 63.0;
   $70 = (($sources) + 8|0);
   $71 = HEAP32[$70>>2]|0;
   $72 = (($71) + 1|0);
   $73 = HEAP8[$72>>0]|0;
   $74 = (+($73&255));
   $75 = $74 / 31.0;
   __ZN6squish4Vec3C2Efff($3,$63,$69,$75);
   ;HEAP32[$58+0>>2]=HEAP32[$3+0>>2]|0;HEAP32[$58+4>>2]=HEAP32[$3+4>>2]|0;HEAP32[$58+8>>2]=HEAP32[$3+8>>2]|0;
   $76 = $index;
   $77 = $76<<1;
   $78 = $77&255;
   $79 = (($4) + 40|0);
   HEAP8[$79>>0] = $78;
   $80 = $error;
   $81 = (($4) + 44|0);
   HEAP32[$81>>2] = $80;
  }
  $82 = $index;
  $83 = (($82) + 1)|0;
  $index = $83;
 }
 STACKTOP = sp;return;
}
function __ZN6squish15SingleColourFit9Compress4EPv($this,$block) {
 $this = $this|0;
 $block = $block|0;
 var $0 = 0, $1 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $2 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, $indices = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 32|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $indices = sp + 8|0;
 $0 = $this;
 $1 = $block;
 $2 = $0;
 __ZN6squish15SingleColourFit16ComputeEndPointsEPKPKNS_18SingleColourLookupE($2,3272);
 $3 = (($2) + 44|0);
 $4 = HEAP32[$3>>2]|0;
 $5 = (($2) + 48|0);
 $6 = HEAP32[$5>>2]|0;
 $7 = ($4|0)<($6|0);
 if (!($7)) {
  STACKTOP = sp;return;
 }
 $8 = (($2) + 4|0);
 $9 = HEAP32[$8>>2]|0;
 $10 = (($2) + 40|0);
 __ZNK6squish9ColourSet12RemapIndicesEPKhPh($9,$10,$indices);
 $11 = (($2) + 16|0);
 $12 = (($2) + 28|0);
 $13 = $1;
 __ZN6squish17WriteColourBlock4ERKNS_4Vec3ES2_PKhPv($11,$12,$indices,$13);
 $14 = (($2) + 44|0);
 $15 = HEAP32[$14>>2]|0;
 $16 = (($2) + 48|0);
 HEAP32[$16>>2] = $15;
 STACKTOP = sp;return;
}
function __ZN6squishL10FloatToIntEfi14($a,$limit) {
 $a = +$a;
 $limit = $limit|0;
 var $0 = 0.0, $1 = 0, $10 = 0, $11 = 0, $2 = 0.0, $3 = 0.0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, $i = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $0 = $a;
 $1 = $limit;
 $2 = $0;
 $3 = $2 + 0.5;
 $4 = (~~(($3)));
 $i = $4;
 $5 = $i;
 $6 = ($5|0)<(0);
 if ($6) {
  $i = 0;
  $11 = $i;
  STACKTOP = sp;return ($11|0);
 }
 $7 = $i;
 $8 = $1;
 $9 = ($7|0)>($8|0);
 if ($9) {
  $10 = $1;
  $i = $10;
 }
 $11 = $i;
 STACKTOP = sp;return ($11|0);
}
function __ZN6squish14CompressMaskedEPKhiPvi($rgba,$mask,$block,$flags) {
 $rgba = $rgba|0;
 $mask = $mask|0;
 $block = $block|0;
 $flags = $flags|0;
 var $0 = 0, $1 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $2 = 0, $20 = 0, $21 = 0, $22 = 0, $23 = 0, $24 = 0, $25 = 0, $26 = 0;
 var $27 = 0, $28 = 0, $29 = 0, $3 = 0, $30 = 0, $31 = 0, $32 = 0, $33 = 0, $34 = 0, $35 = 0, $36 = 0, $37 = 0, $38 = 0, $39 = 0, $4 = 0, $40 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0;
 var $9 = 0, $alphaBock = 0, $colourBlock = 0, $colours = 0, $fit = 0, $fit1 = 0, $fit2 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 928|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $colours = sp + 568|0;
 $fit = sp + 512|0;
 $fit1 = sp + 460|0;
 $fit2 = sp;
 $0 = $rgba;
 $1 = $mask;
 $2 = $block;
 $3 = $flags;
 $4 = $3;
 $5 = (__ZN6squishL8FixFlagsEi($4)|0);
 $3 = $5;
 $6 = $2;
 $colourBlock = $6;
 $7 = $2;
 $alphaBock = $7;
 $8 = $3;
 $9 = $8 & 6;
 $10 = ($9|0)!=(0);
 if ($10) {
  $11 = $2;
  $12 = (($11) + 8|0);
  $colourBlock = $12;
 }
 $13 = $0;
 $14 = $1;
 $15 = $3;
 __ZN6squish9ColourSetC2EPKhii($colours,$13,$14,$15);
 $16 = (__ZNK6squish9ColourSet8GetCountEv($colours)|0);
 $17 = ($16|0)==(1);
 if ($17) {
  $18 = $3;
  __ZN6squish15SingleColourFitC2EPKNS_9ColourSetEi($fit,$colours,$18);
  $19 = $colourBlock;
  __ZN6squish9ColourFit8CompressEPv($fit,$19);
 } else {
  $20 = $3;
  $21 = $20 & 16;
  $22 = ($21|0)!=(0);
  if ($22) {
   label = 7;
  } else {
   $23 = (__ZNK6squish9ColourSet8GetCountEv($colours)|0);
   $24 = ($23|0)==(0);
   if ($24) {
    label = 7;
   } else {
    $27 = $3;
    __ZN6squish10ClusterFitC2EPKNS_9ColourSetEi($fit2,$colours,$27);
    $28 = $colourBlock;
    __ZN6squish9ColourFit8CompressEPv($fit2,$28);
   }
  }
  if ((label|0) == 7) {
   $25 = $3;
   __ZN6squish8RangeFitC2EPKNS_9ColourSetEi($fit1,$colours,$25);
   $26 = $colourBlock;
   __ZN6squish9ColourFit8CompressEPv($fit1,$26);
  }
 }
 $29 = $3;
 $30 = $29 & 2;
 $31 = ($30|0)!=(0);
 if ($31) {
  $32 = $0;
  $33 = $1;
  $34 = $alphaBock;
  __ZN6squish17CompressAlphaDxt3EPKhiPv($32,$33,$34);
  STACKTOP = sp;return;
 }
 $35 = $3;
 $36 = $35 & 4;
 $37 = ($36|0)!=(0);
 if ($37) {
  $38 = $0;
  $39 = $1;
  $40 = $alphaBock;
  __ZN6squish17CompressAlphaDxt5EPKhiPv($38,$39,$40);
 }
 STACKTOP = sp;return;
}
function __ZN6squish10DecompressEPhPKvi($rgba,$block,$flags) {
 $rgba = $rgba|0;
 $block = $block|0;
 $flags = $flags|0;
 var $0 = 0, $1 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $2 = 0, $20 = 0, $21 = 0, $22 = 0, $23 = 0, $24 = 0, $25 = 0, $26 = 0;
 var $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, $alphaBock = 0, $colourBlock = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 32|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $0 = $rgba;
 $1 = $block;
 $2 = $flags;
 $3 = $2;
 $4 = (__ZN6squishL8FixFlagsEi($3)|0);
 $2 = $4;
 $5 = $1;
 $colourBlock = $5;
 $6 = $1;
 $alphaBock = $6;
 $7 = $2;
 $8 = $7 & 6;
 $9 = ($8|0)!=(0);
 if ($9) {
  $10 = $1;
  $11 = (($10) + 8|0);
  $colourBlock = $11;
 }
 $12 = $0;
 $13 = $colourBlock;
 $14 = $2;
 $15 = $14 & 1;
 $16 = ($15|0)!=(0);
 __ZN6squish16DecompressColourEPhPKvb($12,$13,$16);
 $17 = $2;
 $18 = $17 & 2;
 $19 = ($18|0)!=(0);
 if ($19) {
  $20 = $0;
  $21 = $alphaBock;
  __ZN6squish19DecompressAlphaDxt3EPhPKv($20,$21);
  STACKTOP = sp;return;
 }
 $22 = $2;
 $23 = $22 & 4;
 $24 = ($23|0)!=(0);
 if ($24) {
  $25 = $0;
  $26 = $alphaBock;
  __ZN6squish19DecompressAlphaDxt5EPhPKv($25,$26);
 }
 STACKTOP = sp;return;
}
function __ZN6squish22GetStorageRequirementsEiii($width,$height,$flags) {
 $width = $width|0;
 $height = $height|0;
 $flags = $flags|0;
 var $0 = 0, $1 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $2 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, $blockcount = 0;
 var $blocksize = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 32|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $0 = $width;
 $1 = $height;
 $2 = $flags;
 $3 = $2;
 $4 = (__ZN6squishL8FixFlagsEi($3)|0);
 $2 = $4;
 $5 = $0;
 $6 = (($5) + 3)|0;
 $7 = (($6|0) / 4)&-1;
 $8 = $1;
 $9 = (($8) + 3)|0;
 $10 = (($9|0) / 4)&-1;
 $11 = Math_imul($7, $10)|0;
 $blockcount = $11;
 $12 = $2;
 $13 = $12 & 1;
 $14 = ($13|0)!=(0);
 $15 = $14 ? 8 : 16;
 $blocksize = $15;
 $16 = $blockcount;
 $17 = $blocksize;
 $18 = Math_imul($16, $17)|0;
 STACKTOP = sp;return ($18|0);
}
function __ZN6squish13CompressImageEPKhiiPvi($rgba,$width,$height,$blocks,$flags) {
 $rgba = $rgba|0;
 $width = $width|0;
 $height = $height|0;
 $blocks = $blocks|0;
 $flags = $flags|0;
 var $0 = 0, $1 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $2 = 0, $20 = 0, $21 = 0, $22 = 0, $23 = 0, $24 = 0, $25 = 0, $26 = 0;
 var $27 = 0, $28 = 0, $29 = 0, $3 = 0, $30 = 0, $31 = 0, $32 = 0, $33 = 0, $34 = 0, $35 = 0, $36 = 0, $37 = 0, $38 = 0, $39 = 0, $4 = 0, $40 = 0, $41 = 0, $42 = 0, $43 = 0, $44 = 0;
 var $45 = 0, $46 = 0, $47 = 0, $48 = 0, $49 = 0, $5 = 0, $50 = 0, $51 = 0, $52 = 0, $53 = 0, $54 = 0, $55 = 0, $56 = 0, $57 = 0, $58 = 0, $59 = 0, $6 = 0, $60 = 0, $61 = 0, $62 = 0;
 var $63 = 0, $64 = 0, $65 = 0, $66 = 0, $67 = 0, $68 = 0, $69 = 0, $7 = 0, $70 = 0, $71 = 0, $72 = 0, $73 = 0, $8 = 0, $9 = 0, $bytesPerBlock = 0, $i = 0, $mask = 0, $px = 0, $py = 0, $sourcePixel = 0;
 var $sourceRgba = 0, $sx = 0, $sy = 0, $targetBlock = 0, $targetPixel = 0, $x = 0, $y = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 144|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $sourceRgba = sp + 72|0;
 $0 = $rgba;
 $1 = $width;
 $2 = $height;
 $3 = $blocks;
 $4 = $flags;
 $5 = $4;
 $6 = (__ZN6squishL8FixFlagsEi($5)|0);
 $4 = $6;
 $7 = $3;
 $targetBlock = $7;
 $8 = $4;
 $9 = $8 & 1;
 $10 = ($9|0)!=(0);
 $11 = $10 ? 8 : 16;
 $bytesPerBlock = $11;
 $y = 0;
 while(1) {
  $12 = $y;
  $13 = $2;
  $14 = ($12|0)<($13|0);
  if (!($14)) {
   break;
  }
  $x = 0;
  while(1) {
   $15 = $x;
   $16 = $1;
   $17 = ($15|0)<($16|0);
   if (!($17)) {
    break;
   }
   $targetPixel = $sourceRgba;
   $mask = 0;
   $py = 0;
   while(1) {
    $18 = $py;
    $19 = ($18|0)<(4);
    if (!($19)) {
     break;
    }
    $px = 0;
    while(1) {
     $20 = $px;
     $21 = ($20|0)<(4);
     if (!($21)) {
      break;
     }
     $22 = $x;
     $23 = $px;
     $24 = (($22) + ($23))|0;
     $sx = $24;
     $25 = $y;
     $26 = $py;
     $27 = (($25) + ($26))|0;
     $sy = $27;
     $28 = $sx;
     $29 = $1;
     $30 = ($28|0)<($29|0);
     if ($30) {
      $31 = $sy;
      $32 = $2;
      $33 = ($31|0)<($32|0);
      if ($33) {
       $34 = $0;
       $35 = $1;
       $36 = $sy;
       $37 = Math_imul($35, $36)|0;
       $38 = $sx;
       $39 = (($37) + ($38))|0;
       $40 = $39<<2;
       $41 = (($34) + ($40)|0);
       $sourcePixel = $41;
       $i = 0;
       while(1) {
        $42 = $i;
        $43 = ($42|0)<(4);
        if (!($43)) {
         break;
        }
        $44 = $sourcePixel;
        $45 = (($44) + 1|0);
        $sourcePixel = $45;
        $46 = HEAP8[$44>>0]|0;
        $47 = $targetPixel;
        $48 = (($47) + 1|0);
        $targetPixel = $48;
        HEAP8[$47>>0] = $46;
        $49 = $i;
        $50 = (($49) + 1)|0;
        $i = $50;
       }
       $51 = $py;
       $52 = $51<<2;
       $53 = $px;
       $54 = (($52) + ($53))|0;
       $55 = 1 << $54;
       $56 = $mask;
       $57 = $56 | $55;
       $mask = $57;
      } else {
       label = 16;
      }
     } else {
      label = 16;
     }
     if ((label|0) == 16) {
      label = 0;
      $58 = $targetPixel;
      $59 = (($58) + 4|0);
      $targetPixel = $59;
     }
     $60 = $px;
     $61 = (($60) + 1)|0;
     $px = $61;
    }
    $62 = $py;
    $63 = (($62) + 1)|0;
    $py = $63;
   }
   $64 = $mask;
   $65 = $targetBlock;
   $66 = $4;
   __ZN6squish14CompressMaskedEPKhiPvi($sourceRgba,$64,$65,$66);
   $67 = $bytesPerBlock;
   $68 = $targetBlock;
   $69 = (($68) + ($67)|0);
   $targetBlock = $69;
   $70 = $x;
   $71 = (($70) + 4)|0;
   $x = $71;
  }
  $72 = $y;
  $73 = (($72) + 4)|0;
  $y = $73;
 }
 STACKTOP = sp;return;
}
function __ZN6squish15DecompressImageEPhiiPKvi($rgba,$width,$height,$blocks,$flags) {
 $rgba = $rgba|0;
 $width = $width|0;
 $height = $height|0;
 $blocks = $blocks|0;
 $flags = $flags|0;
 var $0 = 0, $1 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $2 = 0, $20 = 0, $21 = 0, $22 = 0, $23 = 0, $24 = 0, $25 = 0, $26 = 0;
 var $27 = 0, $28 = 0, $29 = 0, $3 = 0, $30 = 0, $31 = 0, $32 = 0, $33 = 0, $34 = 0, $35 = 0, $36 = 0, $37 = 0, $38 = 0, $39 = 0, $4 = 0, $40 = 0, $41 = 0, $42 = 0, $43 = 0, $44 = 0;
 var $45 = 0, $46 = 0, $47 = 0, $48 = 0, $49 = 0, $5 = 0, $50 = 0, $51 = 0, $52 = 0, $53 = 0, $54 = 0, $55 = 0, $56 = 0, $57 = 0, $58 = 0, $59 = 0, $6 = 0, $60 = 0, $61 = 0, $62 = 0;
 var $63 = 0, $64 = 0, $65 = 0, $7 = 0, $8 = 0, $9 = 0, $bytesPerBlock = 0, $i = 0, $px = 0, $py = 0, $sourceBlock = 0, $sourcePixel = 0, $sx = 0, $sy = 0, $targetPixel = 0, $targetRgba = 0, $x = 0, $y = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 128|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $targetRgba = sp + 64|0;
 $0 = $rgba;
 $1 = $width;
 $2 = $height;
 $3 = $blocks;
 $4 = $flags;
 $5 = $4;
 $6 = (__ZN6squishL8FixFlagsEi($5)|0);
 $4 = $6;
 $7 = $3;
 $sourceBlock = $7;
 $8 = $4;
 $9 = $8 & 1;
 $10 = ($9|0)!=(0);
 $11 = $10 ? 8 : 16;
 $bytesPerBlock = $11;
 $y = 0;
 while(1) {
  $12 = $y;
  $13 = $2;
  $14 = ($12|0)<($13|0);
  if (!($14)) {
   break;
  }
  $x = 0;
  while(1) {
   $15 = $x;
   $16 = $1;
   $17 = ($15|0)<($16|0);
   if (!($17)) {
    break;
   }
   $18 = $sourceBlock;
   $19 = $4;
   __ZN6squish10DecompressEPhPKvi($targetRgba,$18,$19);
   $sourcePixel = $targetRgba;
   $py = 0;
   while(1) {
    $20 = $py;
    $21 = ($20|0)<(4);
    if (!($21)) {
     break;
    }
    $px = 0;
    while(1) {
     $22 = $px;
     $23 = ($22|0)<(4);
     if (!($23)) {
      break;
     }
     $24 = $x;
     $25 = $px;
     $26 = (($24) + ($25))|0;
     $sx = $26;
     $27 = $y;
     $28 = $py;
     $29 = (($27) + ($28))|0;
     $sy = $29;
     $30 = $sx;
     $31 = $1;
     $32 = ($30|0)<($31|0);
     if ($32) {
      $33 = $sy;
      $34 = $2;
      $35 = ($33|0)<($34|0);
      if ($35) {
       $36 = $0;
       $37 = $1;
       $38 = $sy;
       $39 = Math_imul($37, $38)|0;
       $40 = $sx;
       $41 = (($39) + ($40))|0;
       $42 = $41<<2;
       $43 = (($36) + ($42)|0);
       $targetPixel = $43;
       $i = 0;
       while(1) {
        $44 = $i;
        $45 = ($44|0)<(4);
        if (!($45)) {
         break;
        }
        $46 = $sourcePixel;
        $47 = (($46) + 1|0);
        $sourcePixel = $47;
        $48 = HEAP8[$46>>0]|0;
        $49 = $targetPixel;
        $50 = (($49) + 1|0);
        $targetPixel = $50;
        HEAP8[$49>>0] = $48;
        $51 = $i;
        $52 = (($51) + 1)|0;
        $i = $52;
       }
      } else {
       label = 16;
      }
     } else {
      label = 16;
     }
     if ((label|0) == 16) {
      label = 0;
      $53 = $sourcePixel;
      $54 = (($53) + 4|0);
      $sourcePixel = $54;
     }
     $55 = $px;
     $56 = (($55) + 1)|0;
     $px = $56;
    }
    $57 = $py;
    $58 = (($57) + 1)|0;
    $py = $58;
   }
   $59 = $bytesPerBlock;
   $60 = $sourceBlock;
   $61 = (($60) + ($59)|0);
   $sourceBlock = $61;
   $62 = $x;
   $63 = (($62) + 4)|0;
   $x = $63;
  }
  $64 = $y;
  $65 = (($64) + 4)|0;
  $y = $65;
 }
 STACKTOP = sp;return;
}
function _GetStorageRequirements($width,$height,$flags) {
 $width = $width|0;
 $height = $height|0;
 $flags = $flags|0;
 var $0 = 0, $1 = 0, $2 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $0 = $width;
 $1 = $height;
 $2 = $flags;
 $3 = $0;
 $4 = $1;
 $5 = $2;
 $6 = (__ZN6squish22GetStorageRequirementsEiii($3,$4,$5)|0);
 STACKTOP = sp;return ($6|0);
}
function _CompressImage($rgba,$width,$height,$blocks,$flags) {
 $rgba = $rgba|0;
 $width = $width|0;
 $height = $height|0;
 $blocks = $blocks|0;
 $flags = $flags|0;
 var $0 = 0, $1 = 0, $2 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 32|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $0 = $rgba;
 $1 = $width;
 $2 = $height;
 $3 = $blocks;
 $4 = $flags;
 $5 = $0;
 $6 = $1;
 $7 = $2;
 $8 = $3;
 $9 = $4;
 __ZN6squish13CompressImageEPKhiiPvi($5,$6,$7,$8,$9);
 STACKTOP = sp;return;
}
function _DecompressImage($rgba,$width,$height,$blocks,$flags) {
 $rgba = $rgba|0;
 $width = $width|0;
 $height = $height|0;
 $blocks = $blocks|0;
 $flags = $flags|0;
 var $0 = 0, $1 = 0, $2 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 32|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $0 = $rgba;
 $1 = $width;
 $2 = $height;
 $3 = $blocks;
 $4 = $flags;
 $5 = $0;
 $6 = $1;
 $7 = $2;
 $8 = $3;
 $9 = $4;
 __ZN6squish15DecompressImageEPhiiPKvi($5,$6,$7,$8,$9);
 STACKTOP = sp;return;
}
function __ZN6squishL8FixFlagsEi($flags) {
 $flags = $flags|0;
 var $0 = 0, $1 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $2 = 0, $20 = 0, $21 = 0, $22 = 0, $23 = 0, $3 = 0, $4 = 0, $5 = 0;
 var $6 = 0, $7 = 0, $8 = 0, $9 = 0, $extra = 0, $fit = 0, $method = 0, $metric = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 32|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $0 = $flags;
 $1 = $0;
 $2 = $1 & 7;
 $method = $2;
 $3 = $0;
 $4 = $3 & 280;
 $fit = $4;
 $5 = $0;
 $6 = $5 & 96;
 $metric = $6;
 $7 = $0;
 $8 = $7 & 128;
 $extra = $8;
 $9 = $method;
 $10 = ($9|0)!=(2);
 if ($10) {
  $11 = $method;
  $12 = ($11|0)!=(4);
  if ($12) {
   $method = 1;
  }
 }
 $13 = $fit;
 $14 = ($13|0)!=(16);
 if ($14) {
  $fit = 8;
 }
 $15 = $metric;
 $16 = ($15|0)!=(64);
 if ($16) {
  $metric = 32;
 }
 $17 = $method;
 $18 = $fit;
 $19 = $17 | $18;
 $20 = $metric;
 $21 = $19 | $20;
 $22 = $extra;
 $23 = $21 | $22;
 STACKTOP = sp;return ($23|0);
}
function __ZdlPv($ptr) {
 $ptr = $ptr|0;
 var label = 0, sp = 0;
 sp = STACKTOP;
 _free($ptr);
 return;
}
function __ZNSt9type_infoD2Ev($this) {
 $this = $this|0;
 var label = 0, sp = 0;
 sp = STACKTOP;
 return;
}
function __ZN10__cxxabiv116__shim_type_infoD2Ev($this) {
 $this = $this|0;
 var label = 0, sp = 0;
 sp = STACKTOP;
 return;
}
function __ZNK10__cxxabiv116__shim_type_info5noop1Ev($this) {
 $this = $this|0;
 var label = 0, sp = 0;
 sp = STACKTOP;
 return;
}
function __ZNK10__cxxabiv116__shim_type_info5noop2Ev($this) {
 $this = $this|0;
 var label = 0, sp = 0;
 sp = STACKTOP;
 return;
}
function __ZN10__cxxabiv117__class_type_infoD0Ev($this) {
 $this = $this|0;
 var label = 0, sp = 0;
 sp = STACKTOP;
 __ZdlPv($this);
 return;
}
function __ZN10__cxxabiv120__si_class_type_infoD0Ev($this) {
 $this = $this|0;
 var label = 0, sp = 0;
 sp = STACKTOP;
 __ZdlPv($this);
 return;
}
function __ZNK10__cxxabiv117__class_type_info9can_catchEPKNS_16__shim_type_infoERPv($this,$thrown_type,$adjustedPtr) {
 $this = $this|0;
 $thrown_type = $thrown_type|0;
 $adjustedPtr = $adjustedPtr|0;
 var $$1 = 0, $0 = 0, $1 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $2 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, $info = 0, dest = 0, label = 0;
 var sp = 0, stop = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 64|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $info = sp;
 $0 = ($this|0)==($thrown_type|0);
 if ($0) {
  $$1 = 1;
 } else {
  $1 = ($thrown_type|0)==(0|0);
  if ($1) {
   $$1 = 0;
  } else {
   $2 = (___dynamic_cast($thrown_type,6472,6528,0)|0);
   $3 = ($2|0)==(0|0);
   if ($3) {
    $$1 = 0;
   } else {
    dest=$info+0|0; stop=dest+56|0; do { HEAP32[dest>>2]=0|0; dest=dest+4|0; } while ((dest|0) < (stop|0));
    HEAP32[$info>>2] = $2;
    $4 = (($info) + 8|0);
    HEAP32[$4>>2] = $this;
    $5 = (($info) + 12|0);
    HEAP32[$5>>2] = -1;
    $6 = (($info) + 48|0);
    HEAP32[$6>>2] = 1;
    $7 = HEAP32[$2>>2]|0;
    $8 = (($7) + 28|0);
    $9 = HEAP32[$8>>2]|0;
    $10 = HEAP32[$adjustedPtr>>2]|0;
    FUNCTION_TABLE_viiii[$9 & 31]($2,$info,$10,1);
    $11 = (($info) + 24|0);
    $12 = HEAP32[$11>>2]|0;
    $13 = ($12|0)==(1);
    if ($13) {
     $14 = (($info) + 16|0);
     $15 = HEAP32[$14>>2]|0;
     HEAP32[$adjustedPtr>>2] = $15;
     $$1 = 1;
    } else {
     $$1 = 0;
    }
   }
  }
 }
 STACKTOP = sp;return ($$1|0);
}
function __ZNK10__cxxabiv117__class_type_info24process_found_base_classEPNS_19__dynamic_cast_infoEPvi($this,$info,$adjustedPtr,$path_below) {
 $this = $this|0;
 $info = $info|0;
 $adjustedPtr = $adjustedPtr|0;
 $path_below = $path_below|0;
 var $0 = 0, $1 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $2 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 $0 = (($info) + 16|0);
 $1 = HEAP32[$0>>2]|0;
 $2 = ($1|0)==(0|0);
 do {
  if ($2) {
   HEAP32[$0>>2] = $adjustedPtr;
   $3 = (($info) + 24|0);
   HEAP32[$3>>2] = $path_below;
   $4 = (($info) + 36|0);
   HEAP32[$4>>2] = 1;
  } else {
   $5 = ($1|0)==($adjustedPtr|0);
   if (!($5)) {
    $9 = (($info) + 36|0);
    $10 = HEAP32[$9>>2]|0;
    $11 = (($10) + 1)|0;
    HEAP32[$9>>2] = $11;
    $12 = (($info) + 24|0);
    HEAP32[$12>>2] = 2;
    $13 = (($info) + 54|0);
    HEAP8[$13>>0] = 1;
    break;
   }
   $6 = (($info) + 24|0);
   $7 = HEAP32[$6>>2]|0;
   $8 = ($7|0)==(2);
   if ($8) {
    HEAP32[$6>>2] = $path_below;
   }
  }
 } while(0);
 return;
}
function __ZNK10__cxxabiv117__class_type_info27has_unambiguous_public_baseEPNS_19__dynamic_cast_infoEPvi($this,$info,$adjustedPtr,$path_below) {
 $this = $this|0;
 $info = $info|0;
 $adjustedPtr = $adjustedPtr|0;
 $path_below = $path_below|0;
 var $0 = 0, $1 = 0, $2 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 $0 = (($info) + 8|0);
 $1 = HEAP32[$0>>2]|0;
 $2 = ($1|0)==($this|0);
 if ($2) {
  __ZNK10__cxxabiv117__class_type_info24process_found_base_classEPNS_19__dynamic_cast_infoEPvi(0,$info,$adjustedPtr,$path_below);
 }
 return;
}
function __ZNK10__cxxabiv120__si_class_type_info27has_unambiguous_public_baseEPNS_19__dynamic_cast_infoEPvi($this,$info,$adjustedPtr,$path_below) {
 $this = $this|0;
 $info = $info|0;
 $adjustedPtr = $adjustedPtr|0;
 $path_below = $path_below|0;
 var $0 = 0, $1 = 0, $2 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 $0 = (($info) + 8|0);
 $1 = HEAP32[$0>>2]|0;
 $2 = ($this|0)==($1|0);
 if ($2) {
  __ZNK10__cxxabiv117__class_type_info24process_found_base_classEPNS_19__dynamic_cast_infoEPvi(0,$info,$adjustedPtr,$path_below);
 } else {
  $3 = (($this) + 8|0);
  $4 = HEAP32[$3>>2]|0;
  $5 = HEAP32[$4>>2]|0;
  $6 = (($5) + 28|0);
  $7 = HEAP32[$6>>2]|0;
  FUNCTION_TABLE_viiii[$7 & 31]($4,$info,$adjustedPtr,$path_below);
 }
 return;
}
function ___dynamic_cast($static_ptr,$static_type,$dst_type,$src2dst_offset) {
 $static_ptr = $static_ptr|0;
 $static_type = $static_type|0;
 $dst_type = $dst_type|0;
 $src2dst_offset = $src2dst_offset|0;
 var $$ = 0, $$8 = 0, $0 = 0, $1 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $2 = 0, $20 = 0, $21 = 0, $22 = 0, $23 = 0, $24 = 0;
 var $25 = 0, $26 = 0, $27 = 0, $28 = 0, $29 = 0, $3 = 0, $30 = 0, $31 = 0, $32 = 0, $33 = 0, $34 = 0, $35 = 0, $36 = 0, $37 = 0, $38 = 0, $39 = 0, $4 = 0, $40 = 0, $41 = 0, $42 = 0;
 var $43 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, $dst_ptr$0 = 0, $info = 0, $or$cond = 0, $or$cond3 = 0, $or$cond5 = 0, $or$cond7 = 0, dest = 0, label = 0, sp = 0, stop = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 64|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $info = sp;
 $0 = HEAP32[$static_ptr>>2]|0;
 $1 = (($0) + -8|0);
 $2 = HEAP32[$1>>2]|0;
 $3 = $2;
 $4 = (($static_ptr) + ($3)|0);
 $5 = (($0) + -4|0);
 $6 = HEAP32[$5>>2]|0;
 HEAP32[$info>>2] = $dst_type;
 $7 = (($info) + 4|0);
 HEAP32[$7>>2] = $static_ptr;
 $8 = (($info) + 8|0);
 HEAP32[$8>>2] = $static_type;
 $9 = (($info) + 12|0);
 HEAP32[$9>>2] = $src2dst_offset;
 $10 = (($info) + 16|0);
 $11 = (($info) + 20|0);
 $12 = (($info) + 24|0);
 $13 = (($info) + 28|0);
 $14 = (($info) + 32|0);
 $15 = (($info) + 40|0);
 $16 = ($6|0)==($dst_type|0);
 dest=$10+0|0; stop=dest+36|0; do { HEAP32[dest>>2]=0|0; dest=dest+4|0; } while ((dest|0) < (stop|0));HEAP16[$10+36>>1]=0|0;HEAP8[$10+38>>0]=0|0;
 do {
  if ($16) {
   $17 = (($info) + 48|0);
   HEAP32[$17>>2] = 1;
   $18 = HEAP32[$6>>2]|0;
   $19 = (($18) + 20|0);
   $20 = HEAP32[$19>>2]|0;
   FUNCTION_TABLE_viiiiii[$20 & 31]($6,$info,$4,$4,1,0);
   $21 = HEAP32[$12>>2]|0;
   $22 = ($21|0)==(1);
   $$ = $22 ? $4 : 0;
   $dst_ptr$0 = $$;
  } else {
   $23 = (($info) + 36|0);
   $24 = HEAP32[$6>>2]|0;
   $25 = (($24) + 24|0);
   $26 = HEAP32[$25>>2]|0;
   FUNCTION_TABLE_viiiii[$26 & 31]($6,$info,$4,1,0);
   $27 = HEAP32[$23>>2]|0;
   if ((($27|0) == 0)) {
    $28 = HEAP32[$15>>2]|0;
    $29 = ($28|0)==(1);
    $30 = HEAP32[$13>>2]|0;
    $31 = ($30|0)==(1);
    $or$cond = $29 & $31;
    $32 = HEAP32[$14>>2]|0;
    $33 = ($32|0)==(1);
    $or$cond3 = $or$cond & $33;
    $34 = HEAP32[$11>>2]|0;
    $$8 = $or$cond3 ? $34 : 0;
    $dst_ptr$0 = $$8;
    break;
   } else if (!((($27|0) == 1))) {
    $dst_ptr$0 = 0;
    break;
   }
   $35 = HEAP32[$12>>2]|0;
   $36 = ($35|0)==(1);
   if (!($36)) {
    $37 = HEAP32[$15>>2]|0;
    $38 = ($37|0)==(0);
    $39 = HEAP32[$13>>2]|0;
    $40 = ($39|0)==(1);
    $or$cond5 = $38 & $40;
    $41 = HEAP32[$14>>2]|0;
    $42 = ($41|0)==(1);
    $or$cond7 = $or$cond5 & $42;
    if (!($or$cond7)) {
     $dst_ptr$0 = 0;
     break;
    }
   }
   $43 = HEAP32[$10>>2]|0;
   $dst_ptr$0 = $43;
  }
 } while(0);
 STACKTOP = sp;return ($dst_ptr$0|0);
}
function __ZNK10__cxxabiv117__class_type_info29process_static_type_above_dstEPNS_19__dynamic_cast_infoEPKvS4_i($this,$info,$dst_ptr,$current_ptr,$path_below) {
 $this = $this|0;
 $info = $info|0;
 $dst_ptr = $dst_ptr|0;
 $current_ptr = $current_ptr|0;
 $path_below = $path_below|0;
 var $0 = 0, $1 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $2 = 0, $20 = 0, $21 = 0, $22 = 0, $23 = 0, $24 = 0, $25 = 0, $26 = 0;
 var $27 = 0, $28 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, $or$cond = 0, $or$cond1 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 $0 = (($info) + 53|0);
 HEAP8[$0>>0] = 1;
 $1 = (($info) + 4|0);
 $2 = HEAP32[$1>>2]|0;
 $3 = ($2|0)==($current_ptr|0);
 do {
  if ($3) {
   $4 = (($info) + 52|0);
   HEAP8[$4>>0] = 1;
   $5 = (($info) + 16|0);
   $6 = HEAP32[$5>>2]|0;
   $7 = ($6|0)==(0|0);
   if ($7) {
    HEAP32[$5>>2] = $dst_ptr;
    $8 = (($info) + 24|0);
    HEAP32[$8>>2] = $path_below;
    $9 = (($info) + 36|0);
    HEAP32[$9>>2] = 1;
    $10 = (($info) + 48|0);
    $11 = HEAP32[$10>>2]|0;
    $12 = ($11|0)==(1);
    $13 = ($path_below|0)==(1);
    $or$cond = $12 & $13;
    if (!($or$cond)) {
     break;
    }
    $14 = (($info) + 54|0);
    HEAP8[$14>>0] = 1;
    break;
   }
   $15 = ($6|0)==($dst_ptr|0);
   if (!($15)) {
    $25 = (($info) + 36|0);
    $26 = HEAP32[$25>>2]|0;
    $27 = (($26) + 1)|0;
    HEAP32[$25>>2] = $27;
    $28 = (($info) + 54|0);
    HEAP8[$28>>0] = 1;
    break;
   }
   $16 = (($info) + 24|0);
   $17 = HEAP32[$16>>2]|0;
   $18 = ($17|0)==(2);
   if ($18) {
    HEAP32[$16>>2] = $path_below;
    $22 = $path_below;
   } else {
    $22 = $17;
   }
   $19 = (($info) + 48|0);
   $20 = HEAP32[$19>>2]|0;
   $21 = ($20|0)==(1);
   $23 = ($22|0)==(1);
   $or$cond1 = $21 & $23;
   if ($or$cond1) {
    $24 = (($info) + 54|0);
    HEAP8[$24>>0] = 1;
   }
  }
 } while(0);
 return;
}
function __ZNK10__cxxabiv120__si_class_type_info16search_below_dstEPNS_19__dynamic_cast_infoEPKvib($this,$info,$current_ptr,$path_below,$use_strcmp) {
 $this = $this|0;
 $info = $info|0;
 $current_ptr = $current_ptr|0;
 $path_below = $path_below|0;
 $use_strcmp = $use_strcmp|0;
 var $0 = 0, $1 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $2 = 0, $20 = 0, $21 = 0, $22 = 0, $23 = 0, $24 = 0, $25 = 0, $26 = 0;
 var $27 = 0, $28 = 0, $29 = 0, $3 = 0, $30 = 0, $31 = 0, $32 = 0, $33 = 0, $34 = 0, $35 = 0, $36 = 0, $37 = 0, $38 = 0, $39 = 0, $4 = 0, $40 = 0, $41 = 0, $42 = 0, $43 = 0, $44 = 0;
 var $45 = 0, $46 = 0, $47 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, $is_dst_type_derived_from_static_type$0$off01 = 0, $not$ = 0, label = 0, sp = 0;
 sp = STACKTOP;
 $0 = (($info) + 8|0);
 $1 = HEAP32[$0>>2]|0;
 $2 = ($this|0)==($1|0);
 L1: do {
  if ($2) {
   $3 = (($info) + 4|0);
   $4 = HEAP32[$3>>2]|0;
   $5 = ($4|0)==($current_ptr|0);
   if ($5) {
    $6 = (($info) + 28|0);
    $7 = HEAP32[$6>>2]|0;
    $8 = ($7|0)==(1);
    if (!($8)) {
     HEAP32[$6>>2] = $path_below;
    }
   }
  } else {
   $9 = HEAP32[$info>>2]|0;
   $10 = ($this|0)==($9|0);
   if (!($10)) {
    $43 = (($this) + 8|0);
    $44 = HEAP32[$43>>2]|0;
    $45 = HEAP32[$44>>2]|0;
    $46 = (($45) + 24|0);
    $47 = HEAP32[$46>>2]|0;
    FUNCTION_TABLE_viiiii[$47 & 31]($44,$info,$current_ptr,$path_below,$use_strcmp);
    break;
   }
   $11 = (($info) + 16|0);
   $12 = HEAP32[$11>>2]|0;
   $13 = ($12|0)==($current_ptr|0);
   if (!($13)) {
    $14 = (($info) + 20|0);
    $15 = HEAP32[$14>>2]|0;
    $16 = ($15|0)==($current_ptr|0);
    if (!($16)) {
     $19 = (($info) + 32|0);
     HEAP32[$19>>2] = $path_below;
     $20 = (($info) + 44|0);
     $21 = HEAP32[$20>>2]|0;
     $22 = ($21|0)==(4);
     if ($22) {
      break;
     }
     $23 = (($info) + 52|0);
     HEAP8[$23>>0] = 0;
     $24 = (($info) + 53|0);
     HEAP8[$24>>0] = 0;
     $25 = (($this) + 8|0);
     $26 = HEAP32[$25>>2]|0;
     $27 = HEAP32[$26>>2]|0;
     $28 = (($27) + 20|0);
     $29 = HEAP32[$28>>2]|0;
     FUNCTION_TABLE_viiiiii[$29 & 31]($26,$info,$current_ptr,$current_ptr,1,$use_strcmp);
     $30 = HEAP8[$24>>0]|0;
     $31 = ($30<<24>>24)==(0);
     if ($31) {
      $is_dst_type_derived_from_static_type$0$off01 = 0;
      label = 13;
     } else {
      $32 = HEAP8[$23>>0]|0;
      $not$ = ($32<<24>>24)==(0);
      if ($not$) {
       $is_dst_type_derived_from_static_type$0$off01 = 1;
       label = 13;
      }
     }
     do {
      if ((label|0) == 13) {
       HEAP32[$14>>2] = $current_ptr;
       $33 = (($info) + 40|0);
       $34 = HEAP32[$33>>2]|0;
       $35 = (($34) + 1)|0;
       HEAP32[$33>>2] = $35;
       $36 = (($info) + 36|0);
       $37 = HEAP32[$36>>2]|0;
       $38 = ($37|0)==(1);
       if ($38) {
        $39 = (($info) + 24|0);
        $40 = HEAP32[$39>>2]|0;
        $41 = ($40|0)==(2);
        if ($41) {
         $42 = (($info) + 54|0);
         HEAP8[$42>>0] = 1;
         if ($is_dst_type_derived_from_static_type$0$off01) {
          break;
         }
        } else {
         label = 16;
        }
       } else {
        label = 16;
       }
       if ((label|0) == 16) {
        if ($is_dst_type_derived_from_static_type$0$off01) {
         break;
        }
       }
       HEAP32[$20>>2] = 4;
       break L1;
      }
     } while(0);
     HEAP32[$20>>2] = 3;
     break;
    }
   }
   $17 = ($path_below|0)==(1);
   if ($17) {
    $18 = (($info) + 32|0);
    HEAP32[$18>>2] = 1;
   }
  }
 } while(0);
 return;
}
function __ZNK10__cxxabiv117__class_type_info16search_below_dstEPNS_19__dynamic_cast_infoEPKvib($this,$info,$current_ptr,$path_below,$use_strcmp) {
 $this = $this|0;
 $info = $info|0;
 $current_ptr = $current_ptr|0;
 $path_below = $path_below|0;
 $use_strcmp = $use_strcmp|0;
 var $0 = 0, $1 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $2 = 0, $20 = 0, $21 = 0, $22 = 0, $23 = 0, $24 = 0, $25 = 0, $26 = 0;
 var $27 = 0, $28 = 0, $29 = 0, $3 = 0, $30 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 $0 = (($info) + 8|0);
 $1 = HEAP32[$0>>2]|0;
 $2 = ($1|0)==($this|0);
 do {
  if ($2) {
   $3 = (($info) + 4|0);
   $4 = HEAP32[$3>>2]|0;
   $5 = ($4|0)==($current_ptr|0);
   if ($5) {
    $6 = (($info) + 28|0);
    $7 = HEAP32[$6>>2]|0;
    $8 = ($7|0)==(1);
    if (!($8)) {
     HEAP32[$6>>2] = $path_below;
    }
   }
  } else {
   $9 = HEAP32[$info>>2]|0;
   $10 = ($9|0)==($this|0);
   if ($10) {
    $11 = (($info) + 16|0);
    $12 = HEAP32[$11>>2]|0;
    $13 = ($12|0)==($current_ptr|0);
    if (!($13)) {
     $14 = (($info) + 20|0);
     $15 = HEAP32[$14>>2]|0;
     $16 = ($15|0)==($current_ptr|0);
     if (!($16)) {
      $19 = (($info) + 32|0);
      HEAP32[$19>>2] = $path_below;
      HEAP32[$14>>2] = $current_ptr;
      $20 = (($info) + 40|0);
      $21 = HEAP32[$20>>2]|0;
      $22 = (($21) + 1)|0;
      HEAP32[$20>>2] = $22;
      $23 = (($info) + 36|0);
      $24 = HEAP32[$23>>2]|0;
      $25 = ($24|0)==(1);
      if ($25) {
       $26 = (($info) + 24|0);
       $27 = HEAP32[$26>>2]|0;
       $28 = ($27|0)==(2);
       if ($28) {
        $29 = (($info) + 54|0);
        HEAP8[$29>>0] = 1;
       }
      }
      $30 = (($info) + 44|0);
      HEAP32[$30>>2] = 4;
      break;
     }
    }
    $17 = ($path_below|0)==(1);
    if ($17) {
     $18 = (($info) + 32|0);
     HEAP32[$18>>2] = 1;
    }
   }
  }
 } while(0);
 return;
}
function __ZNK10__cxxabiv120__si_class_type_info16search_above_dstEPNS_19__dynamic_cast_infoEPKvS4_ib($this,$info,$dst_ptr,$current_ptr,$path_below,$use_strcmp) {
 $this = $this|0;
 $info = $info|0;
 $dst_ptr = $dst_ptr|0;
 $current_ptr = $current_ptr|0;
 $path_below = $path_below|0;
 $use_strcmp = $use_strcmp|0;
 var $0 = 0, $1 = 0, $2 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 $0 = (($info) + 8|0);
 $1 = HEAP32[$0>>2]|0;
 $2 = ($this|0)==($1|0);
 if ($2) {
  __ZNK10__cxxabiv117__class_type_info29process_static_type_above_dstEPNS_19__dynamic_cast_infoEPKvS4_i(0,$info,$dst_ptr,$current_ptr,$path_below);
 } else {
  $3 = (($this) + 8|0);
  $4 = HEAP32[$3>>2]|0;
  $5 = HEAP32[$4>>2]|0;
  $6 = (($5) + 20|0);
  $7 = HEAP32[$6>>2]|0;
  FUNCTION_TABLE_viiiiii[$7 & 31]($4,$info,$dst_ptr,$current_ptr,$path_below,$use_strcmp);
 }
 return;
}
function __ZNK10__cxxabiv117__class_type_info16search_above_dstEPNS_19__dynamic_cast_infoEPKvS4_ib($this,$info,$dst_ptr,$current_ptr,$path_below,$use_strcmp) {
 $this = $this|0;
 $info = $info|0;
 $dst_ptr = $dst_ptr|0;
 $current_ptr = $current_ptr|0;
 $path_below = $path_below|0;
 $use_strcmp = $use_strcmp|0;
 var $0 = 0, $1 = 0, $2 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 $0 = (($info) + 8|0);
 $1 = HEAP32[$0>>2]|0;
 $2 = ($1|0)==($this|0);
 if ($2) {
  __ZNK10__cxxabiv117__class_type_info29process_static_type_above_dstEPNS_19__dynamic_cast_infoEPKvS4_i(0,$info,$dst_ptr,$current_ptr,$path_below);
 }
 return;
}
function _malloc($bytes) {
 $bytes = $bytes|0;
 var $$lcssa = 0, $$lcssa110 = 0, $$lcssa112 = 0, $$lcssa115 = 0, $$lcssa116 = 0, $$lcssa117 = 0, $$lcssa118 = 0, $$lcssa120 = 0, $$lcssa123 = 0, $$lcssa125 = 0, $$lcssa127 = 0, $$lcssa130 = 0, $$lcssa132 = 0, $$lcssa134 = 0, $$lcssa137 = 0, $$pre = 0, $$pre$i = 0, $$pre$i$i = 0, $$pre$i23$i = 0, $$pre$i25 = 0;
 var $$pre$phi$i$iZ2D = 0, $$pre$phi$i24$iZ2D = 0, $$pre$phi$i26Z2D = 0, $$pre$phi$iZ2D = 0, $$pre$phi59$i$iZ2D = 0, $$pre$phiZ2D = 0, $$pre105 = 0, $$pre58$i$i = 0, $$rsize$0$i = 0, $$rsize$3$i = 0, $$rsize$3$i$lcssa = 0, $$sum = 0, $$sum$i$i = 0, $$sum$i$i$i = 0, $$sum$i12$i = 0, $$sum$i13$i = 0, $$sum$i16$i = 0, $$sum$i19$i = 0, $$sum$i2338 = 0, $$sum$i32 = 0;
 var $$sum$i39 = 0, $$sum1 = 0, $$sum1$i = 0, $$sum1$i$i = 0, $$sum1$i14$i = 0, $$sum1$i20$i = 0, $$sum1$i24 = 0, $$sum10 = 0, $$sum10$i = 0, $$sum10$i$i = 0, $$sum10$pre$i$i = 0, $$sum102$i = 0, $$sum103$i = 0, $$sum104$i = 0, $$sum105$i = 0, $$sum106$i = 0, $$sum107$i = 0, $$sum108$i = 0, $$sum109$i = 0, $$sum11$i = 0;
 var $$sum11$i$i = 0, $$sum11$i22$i = 0, $$sum110$i = 0, $$sum111$i = 0, $$sum1112 = 0, $$sum112$i = 0, $$sum113$i = 0, $$sum114$i = 0, $$sum115$i = 0, $$sum12$i = 0, $$sum12$i$i = 0, $$sum13$i = 0, $$sum13$i$i = 0, $$sum14$i$i = 0, $$sum14$pre$i = 0, $$sum15$i = 0, $$sum15$i$i = 0, $$sum16$i = 0, $$sum16$i$i = 0, $$sum17$i = 0;
 var $$sum17$i$i = 0, $$sum18$i = 0, $$sum1819$i$i = 0, $$sum2 = 0, $$sum2$i = 0, $$sum2$i$i = 0, $$sum2$i$i$i = 0, $$sum2$i15$i = 0, $$sum2$i17$i = 0, $$sum2$i21$i = 0, $$sum2$pre$i = 0, $$sum20$i$i = 0, $$sum21$i$i = 0, $$sum22$i$i = 0, $$sum23$i$i = 0, $$sum24$i$i = 0, $$sum25$i$i = 0, $$sum26$pre$i$i = 0, $$sum27$i$i = 0, $$sum28$i$i = 0;
 var $$sum29$i$i = 0, $$sum3$i = 0, $$sum3$i$i = 0, $$sum3$i27 = 0, $$sum30$i$i = 0, $$sum3132$i$i = 0, $$sum34$i$i = 0, $$sum3536$i$i = 0, $$sum3738$i$i = 0, $$sum39$i$i = 0, $$sum4 = 0, $$sum4$i = 0, $$sum4$i28 = 0, $$sum40$i$i = 0, $$sum41$i$i = 0, $$sum42$i$i = 0, $$sum5$i = 0, $$sum5$i$i = 0, $$sum56 = 0, $$sum6$i = 0;
 var $$sum67$i$i = 0, $$sum7$i = 0, $$sum8$i = 0, $$sum8$pre = 0, $$sum9 = 0, $$sum9$i = 0, $$sum9$i$i = 0, $$tsize$1$i = 0, $$v$0$i = 0, $0 = 0, $1 = 0, $10 = 0, $100 = 0, $1000 = 0, $1001 = 0, $1002 = 0, $1003 = 0, $1004 = 0, $1005 = 0, $1006 = 0;
 var $1007 = 0, $1008 = 0, $1009 = 0, $101 = 0, $1010 = 0, $1011 = 0, $1012 = 0, $1013 = 0, $1014 = 0, $1015 = 0, $1016 = 0, $1017 = 0, $1018 = 0, $1019 = 0, $102 = 0, $1020 = 0, $1021 = 0, $1022 = 0, $1023 = 0, $1024 = 0;
 var $1025 = 0, $1026 = 0, $1027 = 0, $1028 = 0, $1029 = 0, $103 = 0, $1030 = 0, $1031 = 0, $1032 = 0, $1033 = 0, $1034 = 0, $1035 = 0, $1036 = 0, $1037 = 0, $1038 = 0, $1039 = 0, $104 = 0, $1040 = 0, $1041 = 0, $1042 = 0;
 var $1043 = 0, $1044 = 0, $1045 = 0, $1046 = 0, $1047 = 0, $1048 = 0, $1049 = 0, $105 = 0, $1050 = 0, $1051 = 0, $1052 = 0, $1053 = 0, $1054 = 0, $1055 = 0, $1056 = 0, $1057 = 0, $1058 = 0, $1059 = 0, $106 = 0, $1060 = 0;
 var $1061 = 0, $1062 = 0, $1063 = 0, $1064 = 0, $1065 = 0, $1066 = 0, $1067 = 0, $1068 = 0, $1069 = 0, $107 = 0, $1070 = 0, $1071 = 0, $1072 = 0, $1073 = 0, $1074 = 0, $108 = 0, $109 = 0, $11 = 0, $110 = 0, $111 = 0;
 var $112 = 0, $113 = 0, $114 = 0, $115 = 0, $116 = 0, $117 = 0, $118 = 0, $119 = 0, $12 = 0, $120 = 0, $121 = 0, $122 = 0, $123 = 0, $124 = 0, $125 = 0, $126 = 0, $127 = 0, $128 = 0, $129 = 0, $13 = 0;
 var $130 = 0, $131 = 0, $132 = 0, $133 = 0, $134 = 0, $135 = 0, $136 = 0, $137 = 0, $138 = 0, $139 = 0, $14 = 0, $140 = 0, $141 = 0, $142 = 0, $143 = 0, $144 = 0, $145 = 0, $146 = 0, $147 = 0, $148 = 0;
 var $149 = 0, $15 = 0, $150 = 0, $151 = 0, $152 = 0, $153 = 0, $154 = 0, $155 = 0, $156 = 0, $157 = 0, $158 = 0, $159 = 0, $16 = 0, $160 = 0, $161 = 0, $162 = 0, $163 = 0, $164 = 0, $165 = 0, $166 = 0;
 var $167 = 0, $168 = 0, $169 = 0, $17 = 0, $170 = 0, $171 = 0, $172 = 0, $173 = 0, $174 = 0, $175 = 0, $176 = 0, $177 = 0, $178 = 0, $179 = 0, $18 = 0, $180 = 0, $181 = 0, $182 = 0, $183 = 0, $184 = 0;
 var $185 = 0, $186 = 0, $187 = 0, $188 = 0, $189 = 0, $19 = 0, $190 = 0, $191 = 0, $192 = 0, $193 = 0, $194 = 0, $195 = 0, $196 = 0, $197 = 0, $198 = 0, $199 = 0, $2 = 0, $20 = 0, $200 = 0, $201 = 0;
 var $202 = 0, $203 = 0, $204 = 0, $205 = 0, $206 = 0, $207 = 0, $208 = 0, $209 = 0, $21 = 0, $210 = 0, $211 = 0, $212 = 0, $213 = 0, $214 = 0, $215 = 0, $216 = 0, $217 = 0, $218 = 0, $219 = 0, $22 = 0;
 var $220 = 0, $221 = 0, $222 = 0, $223 = 0, $224 = 0, $225 = 0, $226 = 0, $227 = 0, $228 = 0, $229 = 0, $23 = 0, $230 = 0, $231 = 0, $232 = 0, $233 = 0, $234 = 0, $235 = 0, $236 = 0, $237 = 0, $238 = 0;
 var $239 = 0, $24 = 0, $240 = 0, $241 = 0, $242 = 0, $243 = 0, $244 = 0, $245 = 0, $246 = 0, $247 = 0, $248 = 0, $249 = 0, $25 = 0, $250 = 0, $251 = 0, $252 = 0, $253 = 0, $254 = 0, $255 = 0, $256 = 0;
 var $257 = 0, $258 = 0, $259 = 0, $26 = 0, $260 = 0, $261 = 0, $262 = 0, $263 = 0, $264 = 0, $265 = 0, $266 = 0, $267 = 0, $268 = 0, $269 = 0, $27 = 0, $270 = 0, $271 = 0, $272 = 0, $273 = 0, $274 = 0;
 var $275 = 0, $276 = 0, $277 = 0, $278 = 0, $279 = 0, $28 = 0, $280 = 0, $281 = 0, $282 = 0, $283 = 0, $284 = 0, $285 = 0, $286 = 0, $287 = 0, $288 = 0, $289 = 0, $29 = 0, $290 = 0, $291 = 0, $292 = 0;
 var $293 = 0, $294 = 0, $295 = 0, $296 = 0, $297 = 0, $298 = 0, $299 = 0, $3 = 0, $30 = 0, $300 = 0, $301 = 0, $302 = 0, $303 = 0, $304 = 0, $305 = 0, $306 = 0, $307 = 0, $308 = 0, $309 = 0, $31 = 0;
 var $310 = 0, $311 = 0, $312 = 0, $313 = 0, $314 = 0, $315 = 0, $316 = 0, $317 = 0, $318 = 0, $319 = 0, $32 = 0, $320 = 0, $321 = 0, $322 = 0, $323 = 0, $324 = 0, $325 = 0, $326 = 0, $327 = 0, $328 = 0;
 var $329 = 0, $33 = 0, $330 = 0, $331 = 0, $332 = 0, $333 = 0, $334 = 0, $335 = 0, $336 = 0, $337 = 0, $338 = 0, $339 = 0, $34 = 0, $340 = 0, $341 = 0, $342 = 0, $343 = 0, $344 = 0, $345 = 0, $346 = 0;
 var $347 = 0, $348 = 0, $349 = 0, $35 = 0, $350 = 0, $351 = 0, $352 = 0, $353 = 0, $354 = 0, $355 = 0, $356 = 0, $357 = 0, $358 = 0, $359 = 0, $36 = 0, $360 = 0, $361 = 0, $362 = 0, $363 = 0, $364 = 0;
 var $365 = 0, $366 = 0, $367 = 0, $368 = 0, $369 = 0, $37 = 0, $370 = 0, $371 = 0, $372 = 0, $373 = 0, $374 = 0, $375 = 0, $376 = 0, $377 = 0, $378 = 0, $379 = 0, $38 = 0, $380 = 0, $381 = 0, $382 = 0;
 var $383 = 0, $384 = 0, $385 = 0, $386 = 0, $387 = 0, $388 = 0, $389 = 0, $39 = 0, $390 = 0, $391 = 0, $392 = 0, $393 = 0, $394 = 0, $395 = 0, $396 = 0, $397 = 0, $398 = 0, $399 = 0, $4 = 0, $40 = 0;
 var $400 = 0, $401 = 0, $402 = 0, $403 = 0, $404 = 0, $405 = 0, $406 = 0, $407 = 0, $408 = 0, $409 = 0, $41 = 0, $410 = 0, $411 = 0, $412 = 0, $413 = 0, $414 = 0, $415 = 0, $416 = 0, $417 = 0, $418 = 0;
 var $419 = 0, $42 = 0, $420 = 0, $421 = 0, $422 = 0, $423 = 0, $424 = 0, $425 = 0, $426 = 0, $427 = 0, $428 = 0, $429 = 0, $43 = 0, $430 = 0, $431 = 0, $432 = 0, $433 = 0, $434 = 0, $435 = 0, $436 = 0;
 var $437 = 0, $438 = 0, $439 = 0, $44 = 0, $440 = 0, $441 = 0, $442 = 0, $443 = 0, $444 = 0, $445 = 0, $446 = 0, $447 = 0, $448 = 0, $449 = 0, $45 = 0, $450 = 0, $451 = 0, $452 = 0, $453 = 0, $454 = 0;
 var $455 = 0, $456 = 0, $457 = 0, $458 = 0, $459 = 0, $46 = 0, $460 = 0, $461 = 0, $462 = 0, $463 = 0, $464 = 0, $465 = 0, $466 = 0, $467 = 0, $468 = 0, $469 = 0, $47 = 0, $470 = 0, $471 = 0, $472 = 0;
 var $473 = 0, $474 = 0, $475 = 0, $476 = 0, $477 = 0, $478 = 0, $479 = 0, $48 = 0, $480 = 0, $481 = 0, $482 = 0, $483 = 0, $484 = 0, $485 = 0, $486 = 0, $487 = 0, $488 = 0, $489 = 0, $49 = 0, $490 = 0;
 var $491 = 0, $492 = 0, $493 = 0, $494 = 0, $495 = 0, $496 = 0, $497 = 0, $498 = 0, $499 = 0, $5 = 0, $50 = 0, $500 = 0, $501 = 0, $502 = 0, $503 = 0, $504 = 0, $505 = 0, $506 = 0, $507 = 0, $508 = 0;
 var $509 = 0, $51 = 0, $510 = 0, $511 = 0, $512 = 0, $513 = 0, $514 = 0, $515 = 0, $516 = 0, $517 = 0, $518 = 0, $519 = 0, $52 = 0, $520 = 0, $521 = 0, $522 = 0, $523 = 0, $524 = 0, $525 = 0, $526 = 0;
 var $527 = 0, $528 = 0, $529 = 0, $53 = 0, $530 = 0, $531 = 0, $532 = 0, $533 = 0, $534 = 0, $535 = 0, $536 = 0, $537 = 0, $538 = 0, $539 = 0, $54 = 0, $540 = 0, $541 = 0, $542 = 0, $543 = 0, $544 = 0;
 var $545 = 0, $546 = 0, $547 = 0, $548 = 0, $549 = 0, $55 = 0, $550 = 0, $551 = 0, $552 = 0, $553 = 0, $554 = 0, $555 = 0, $556 = 0, $557 = 0, $558 = 0, $559 = 0, $56 = 0, $560 = 0, $561 = 0, $562 = 0;
 var $563 = 0, $564 = 0, $565 = 0, $566 = 0, $567 = 0, $568 = 0, $569 = 0, $57 = 0, $570 = 0, $571 = 0, $572 = 0, $573 = 0, $574 = 0, $575 = 0, $576 = 0, $577 = 0, $578 = 0, $579 = 0, $58 = 0, $580 = 0;
 var $581 = 0, $582 = 0, $583 = 0, $584 = 0, $585 = 0, $586 = 0, $587 = 0, $588 = 0, $589 = 0, $59 = 0, $590 = 0, $591 = 0, $592 = 0, $593 = 0, $594 = 0, $595 = 0, $596 = 0, $597 = 0, $598 = 0, $599 = 0;
 var $6 = 0, $60 = 0, $600 = 0, $601 = 0, $602 = 0, $603 = 0, $604 = 0, $605 = 0, $606 = 0, $607 = 0, $608 = 0, $609 = 0, $61 = 0, $610 = 0, $611 = 0, $612 = 0, $613 = 0, $614 = 0, $615 = 0, $616 = 0;
 var $617 = 0, $618 = 0, $619 = 0, $62 = 0, $620 = 0, $621 = 0, $622 = 0, $623 = 0, $624 = 0, $625 = 0, $626 = 0, $627 = 0, $628 = 0, $629 = 0, $63 = 0, $630 = 0, $631 = 0, $632 = 0, $633 = 0, $634 = 0;
 var $635 = 0, $636 = 0, $637 = 0, $638 = 0, $639 = 0, $64 = 0, $640 = 0, $641 = 0, $642 = 0, $643 = 0, $644 = 0, $645 = 0, $646 = 0, $647 = 0, $648 = 0, $649 = 0, $65 = 0, $650 = 0, $651 = 0, $652 = 0;
 var $653 = 0, $654 = 0, $655 = 0, $656 = 0, $657 = 0, $658 = 0, $659 = 0, $66 = 0, $660 = 0, $661 = 0, $662 = 0, $663 = 0, $664 = 0, $665 = 0, $666 = 0, $667 = 0, $668 = 0, $669 = 0, $67 = 0, $670 = 0;
 var $671 = 0, $672 = 0, $673 = 0, $674 = 0, $675 = 0, $676 = 0, $677 = 0, $678 = 0, $679 = 0, $68 = 0, $680 = 0, $681 = 0, $682 = 0, $683 = 0, $684 = 0, $685 = 0, $686 = 0, $687 = 0, $688 = 0, $689 = 0;
 var $69 = 0, $690 = 0, $691 = 0, $692 = 0, $693 = 0, $694 = 0, $695 = 0, $696 = 0, $697 = 0, $698 = 0, $699 = 0, $7 = 0, $70 = 0, $700 = 0, $701 = 0, $702 = 0, $703 = 0, $704 = 0, $705 = 0, $706 = 0;
 var $707 = 0, $708 = 0, $709 = 0, $71 = 0, $710 = 0, $711 = 0, $712 = 0, $713 = 0, $714 = 0, $715 = 0, $716 = 0, $717 = 0, $718 = 0, $719 = 0, $72 = 0, $720 = 0, $721 = 0, $722 = 0, $723 = 0, $724 = 0;
 var $725 = 0, $726 = 0, $727 = 0, $728 = 0, $729 = 0, $73 = 0, $730 = 0, $731 = 0, $732 = 0, $733 = 0, $734 = 0, $735 = 0, $736 = 0, $737 = 0, $738 = 0, $739 = 0, $74 = 0, $740 = 0, $741 = 0, $742 = 0;
 var $743 = 0, $744 = 0, $745 = 0, $746 = 0, $747 = 0, $748 = 0, $749 = 0, $75 = 0, $750 = 0, $751 = 0, $752 = 0, $753 = 0, $754 = 0, $755 = 0, $756 = 0, $757 = 0, $758 = 0, $759 = 0, $76 = 0, $760 = 0;
 var $761 = 0, $762 = 0, $763 = 0, $764 = 0, $765 = 0, $766 = 0, $767 = 0, $768 = 0, $769 = 0, $77 = 0, $770 = 0, $771 = 0, $772 = 0, $773 = 0, $774 = 0, $775 = 0, $776 = 0, $777 = 0, $778 = 0, $779 = 0;
 var $78 = 0, $780 = 0, $781 = 0, $782 = 0, $783 = 0, $784 = 0, $785 = 0, $786 = 0, $787 = 0, $788 = 0, $789 = 0, $79 = 0, $790 = 0, $791 = 0, $792 = 0, $793 = 0, $794 = 0, $795 = 0, $796 = 0, $797 = 0;
 var $798 = 0, $799 = 0, $8 = 0, $80 = 0, $800 = 0, $801 = 0, $802 = 0, $803 = 0, $804 = 0, $805 = 0, $806 = 0, $807 = 0, $808 = 0, $809 = 0, $81 = 0, $810 = 0, $811 = 0, $812 = 0, $813 = 0, $814 = 0;
 var $815 = 0, $816 = 0, $817 = 0, $818 = 0, $819 = 0, $82 = 0, $820 = 0, $821 = 0, $822 = 0, $823 = 0, $824 = 0, $825 = 0, $826 = 0, $827 = 0, $828 = 0, $829 = 0, $83 = 0, $830 = 0, $831 = 0, $832 = 0;
 var $833 = 0, $834 = 0, $835 = 0, $836 = 0, $837 = 0, $838 = 0, $839 = 0, $84 = 0, $840 = 0, $841 = 0, $842 = 0, $843 = 0, $844 = 0, $845 = 0, $846 = 0, $847 = 0, $848 = 0, $849 = 0, $85 = 0, $850 = 0;
 var $851 = 0, $852 = 0, $853 = 0, $854 = 0, $855 = 0, $856 = 0, $857 = 0, $858 = 0, $859 = 0, $86 = 0, $860 = 0, $861 = 0, $862 = 0, $863 = 0, $864 = 0, $865 = 0, $866 = 0, $867 = 0, $868 = 0, $869 = 0;
 var $87 = 0, $870 = 0, $871 = 0, $872 = 0, $873 = 0, $874 = 0, $875 = 0, $876 = 0, $877 = 0, $878 = 0, $879 = 0, $88 = 0, $880 = 0, $881 = 0, $882 = 0, $883 = 0, $884 = 0, $885 = 0, $886 = 0, $887 = 0;
 var $888 = 0, $889 = 0, $89 = 0, $890 = 0, $891 = 0, $892 = 0, $893 = 0, $894 = 0, $895 = 0, $896 = 0, $897 = 0, $898 = 0, $899 = 0, $9 = 0, $90 = 0, $900 = 0, $901 = 0, $902 = 0, $903 = 0, $904 = 0;
 var $905 = 0, $906 = 0, $907 = 0, $908 = 0, $909 = 0, $91 = 0, $910 = 0, $911 = 0, $912 = 0, $913 = 0, $914 = 0, $915 = 0, $916 = 0, $917 = 0, $918 = 0, $919 = 0, $92 = 0, $920 = 0, $921 = 0, $922 = 0;
 var $923 = 0, $924 = 0, $925 = 0, $926 = 0, $927 = 0, $928 = 0, $929 = 0, $93 = 0, $930 = 0, $931 = 0, $932 = 0, $933 = 0, $934 = 0, $935 = 0, $936 = 0, $937 = 0, $938 = 0, $939 = 0, $94 = 0, $940 = 0;
 var $941 = 0, $942 = 0, $943 = 0, $944 = 0, $945 = 0, $946 = 0, $947 = 0, $948 = 0, $949 = 0, $95 = 0, $950 = 0, $951 = 0, $952 = 0, $953 = 0, $954 = 0, $955 = 0, $956 = 0, $957 = 0, $958 = 0, $959 = 0;
 var $96 = 0, $960 = 0, $961 = 0, $962 = 0, $963 = 0, $964 = 0, $965 = 0, $966 = 0, $967 = 0, $968 = 0, $969 = 0, $97 = 0, $970 = 0, $971 = 0, $972 = 0, $973 = 0, $974 = 0, $975 = 0, $976 = 0, $977 = 0;
 var $978 = 0, $979 = 0, $98 = 0, $980 = 0, $981 = 0, $982 = 0, $983 = 0, $984 = 0, $985 = 0, $986 = 0, $987 = 0, $988 = 0, $989 = 0, $99 = 0, $990 = 0, $991 = 0, $992 = 0, $993 = 0, $994 = 0, $995 = 0;
 var $996 = 0, $997 = 0, $998 = 0, $999 = 0, $F$0$i$i = 0, $F1$0$i = 0, $F4$0 = 0, $F4$0$i$i = 0, $F5$0$i = 0, $I1$0$c$i$i = 0, $I1$0$i$i = 0, $I7$0$i = 0, $I7$0$i$i = 0, $K12$029$i = 0, $K2$015$i$i = 0, $K8$053$i$i = 0, $R$0$i = 0, $R$0$i$be = 0, $R$0$i$i = 0, $R$0$i$i$be = 0;
 var $R$0$i$i$lcssa = 0, $R$0$i$i$ph = 0, $R$0$i$lcssa = 0, $R$0$i$ph = 0, $R$0$i18 = 0, $R$0$i18$be = 0, $R$0$i18$lcssa = 0, $R$0$i18$ph = 0, $R$1$i = 0, $R$1$i$i = 0, $R$1$i20 = 0, $RP$0$i = 0, $RP$0$i$be = 0, $RP$0$i$i = 0, $RP$0$i$i$be = 0, $RP$0$i$i$lcssa = 0, $RP$0$i$i$ph = 0, $RP$0$i$lcssa = 0, $RP$0$i$ph = 0, $RP$0$i17 = 0;
 var $RP$0$i17$be = 0, $RP$0$i17$lcssa = 0, $RP$0$i17$ph = 0, $T$0$lcssa$i = 0, $T$0$lcssa$i$i = 0, $T$0$lcssa$i26$i = 0, $T$014$i$i = 0, $T$014$i$i$lcssa = 0, $T$028$i = 0, $T$028$i$lcssa = 0, $T$052$i$i = 0, $T$052$i$i$lcssa = 0, $br$0$i = 0, $br$030$i = 0, $cond$i = 0, $cond$i$i = 0, $cond$i21 = 0, $exitcond$i$i = 0, $i$02$i$i = 0, $idx$0$i = 0;
 var $mem$0 = 0, $nb$0 = 0, $oldfirst$0$i$i = 0, $or$cond$i = 0, $or$cond$i$i = 0, $or$cond$i27$i = 0, $or$cond$i29 = 0, $or$cond1$i = 0, $or$cond19$i = 0, $or$cond2$i = 0, $or$cond24$i = 0, $or$cond3$i = 0, $or$cond4$i = 0, $or$cond47$i = 0, $or$cond5$i = 0, $or$cond6$i = 0, $or$cond8$i = 0, $qsize$0$i$i = 0, $rsize$0$i = 0, $rsize$0$i$lcssa = 0;
 var $rsize$0$i15 = 0, $rsize$1$i = 0, $rsize$2$i = 0, $rsize$2$i$ph = 0, $rsize$3$lcssa$i = 0, $rsize$331$i = 0, $rst$0$i = 0, $rst$1$i = 0, $sizebits$0$i = 0, $sp$0$i$i = 0, $sp$0$i$i$i = 0, $sp$0$i$i$lcssa = 0, $sp$074$i = 0, $sp$074$i$lcssa = 0, $sp$173$i = 0, $sp$173$i$lcssa = 0, $ssize$0$i = 0, $ssize$1$i = 0, $ssize$129$i = 0, $ssize$2$i = 0;
 var $t$0$i = 0, $t$0$i14 = 0, $t$1$i = 0, $t$1$i$ph = 0, $t$2$ph$i = 0, $t$2$v$3$i = 0, $t$2$v$3$i$lcssa = 0, $t$230$i = 0, $t$230$i$be = 0, $tbase$245$i = 0, $tsize$03141$i = 0, $tsize$1$i = 0, $tsize$244$i = 0, $v$0$i = 0, $v$0$i$lcssa = 0, $v$0$i16 = 0, $v$1$i = 0, $v$2$i = 0, $v$2$i$ph = 0, $v$3$lcssa$i = 0;
 var $v$332$i = 0, label = 0, sp = 0;
 sp = STACKTOP;
 $0 = ($bytes>>>0)<(245);
 do {
  if ($0) {
   $1 = ($bytes>>>0)<(11);
   if ($1) {
    $5 = 16;
   } else {
    $2 = (($bytes) + 11)|0;
    $3 = $2 & -8;
    $5 = $3;
   }
   $4 = $5 >>> 3;
   $6 = HEAP32[6680>>2]|0;
   $7 = $6 >>> $4;
   $8 = $7 & 3;
   $9 = ($8|0)==(0);
   if (!($9)) {
    $10 = $7 & 1;
    $11 = $10 ^ 1;
    $12 = (($11) + ($4))|0;
    $13 = $12 << 1;
    $14 = ((6680 + ($13<<2)|0) + 40|0);
    $$sum10 = (($13) + 2)|0;
    $15 = ((6680 + ($$sum10<<2)|0) + 40|0);
    $16 = HEAP32[$15>>2]|0;
    $17 = (($16) + 8|0);
    $18 = HEAP32[$17>>2]|0;
    $19 = ($14|0)==($18|0);
    do {
     if ($19) {
      $20 = 1 << $12;
      $21 = $20 ^ -1;
      $22 = $6 & $21;
      HEAP32[6680>>2] = $22;
     } else {
      $23 = HEAP32[((6680 + 16|0))>>2]|0;
      $24 = ($18>>>0)<($23>>>0);
      if ($24) {
       _abort();
       // unreachable;
      }
      $25 = (($18) + 12|0);
      $26 = HEAP32[$25>>2]|0;
      $27 = ($26|0)==($16|0);
      if ($27) {
       HEAP32[$25>>2] = $14;
       HEAP32[$15>>2] = $18;
       break;
      } else {
       _abort();
       // unreachable;
      }
     }
    } while(0);
    $28 = $12 << 3;
    $29 = $28 | 3;
    $30 = (($16) + 4|0);
    HEAP32[$30>>2] = $29;
    $$sum1112 = $28 | 4;
    $31 = (($16) + ($$sum1112)|0);
    $32 = HEAP32[$31>>2]|0;
    $33 = $32 | 1;
    HEAP32[$31>>2] = $33;
    $mem$0 = $17;
    return ($mem$0|0);
   }
   $34 = HEAP32[((6680 + 8|0))>>2]|0;
   $35 = ($5>>>0)>($34>>>0);
   if ($35) {
    $36 = ($7|0)==(0);
    if (!($36)) {
     $37 = $7 << $4;
     $38 = 2 << $4;
     $39 = (0 - ($38))|0;
     $40 = $38 | $39;
     $41 = $37 & $40;
     $42 = (0 - ($41))|0;
     $43 = $41 & $42;
     $44 = (($43) + -1)|0;
     $45 = $44 >>> 12;
     $46 = $45 & 16;
     $47 = $44 >>> $46;
     $48 = $47 >>> 5;
     $49 = $48 & 8;
     $50 = $49 | $46;
     $51 = $47 >>> $49;
     $52 = $51 >>> 2;
     $53 = $52 & 4;
     $54 = $50 | $53;
     $55 = $51 >>> $53;
     $56 = $55 >>> 1;
     $57 = $56 & 2;
     $58 = $54 | $57;
     $59 = $55 >>> $57;
     $60 = $59 >>> 1;
     $61 = $60 & 1;
     $62 = $58 | $61;
     $63 = $59 >>> $61;
     $64 = (($62) + ($63))|0;
     $65 = $64 << 1;
     $66 = ((6680 + ($65<<2)|0) + 40|0);
     $$sum4 = (($65) + 2)|0;
     $67 = ((6680 + ($$sum4<<2)|0) + 40|0);
     $68 = HEAP32[$67>>2]|0;
     $69 = (($68) + 8|0);
     $70 = HEAP32[$69>>2]|0;
     $71 = ($66|0)==($70|0);
     do {
      if ($71) {
       $72 = 1 << $64;
       $73 = $72 ^ -1;
       $74 = $6 & $73;
       HEAP32[6680>>2] = $74;
       $88 = $34;
      } else {
       $75 = HEAP32[((6680 + 16|0))>>2]|0;
       $76 = ($70>>>0)<($75>>>0);
       if ($76) {
        _abort();
        // unreachable;
       }
       $77 = (($70) + 12|0);
       $78 = HEAP32[$77>>2]|0;
       $79 = ($78|0)==($68|0);
       if ($79) {
        HEAP32[$77>>2] = $66;
        HEAP32[$67>>2] = $70;
        $$pre = HEAP32[((6680 + 8|0))>>2]|0;
        $88 = $$pre;
        break;
       } else {
        _abort();
        // unreachable;
       }
      }
     } while(0);
     $80 = $64 << 3;
     $81 = (($80) - ($5))|0;
     $82 = $5 | 3;
     $83 = (($68) + 4|0);
     HEAP32[$83>>2] = $82;
     $84 = (($68) + ($5)|0);
     $85 = $81 | 1;
     $$sum56 = $5 | 4;
     $86 = (($68) + ($$sum56)|0);
     HEAP32[$86>>2] = $85;
     $87 = (($68) + ($80)|0);
     HEAP32[$87>>2] = $81;
     $89 = ($88|0)==(0);
     if (!($89)) {
      $90 = HEAP32[((6680 + 20|0))>>2]|0;
      $91 = $88 >>> 3;
      $92 = $91 << 1;
      $93 = ((6680 + ($92<<2)|0) + 40|0);
      $94 = HEAP32[6680>>2]|0;
      $95 = 1 << $91;
      $96 = $94 & $95;
      $97 = ($96|0)==(0);
      if ($97) {
       $98 = $94 | $95;
       HEAP32[6680>>2] = $98;
       $$sum8$pre = (($92) + 2)|0;
       $$pre105 = ((6680 + ($$sum8$pre<<2)|0) + 40|0);
       $$pre$phiZ2D = $$pre105;$F4$0 = $93;
      } else {
       $$sum9 = (($92) + 2)|0;
       $99 = ((6680 + ($$sum9<<2)|0) + 40|0);
       $100 = HEAP32[$99>>2]|0;
       $101 = HEAP32[((6680 + 16|0))>>2]|0;
       $102 = ($100>>>0)<($101>>>0);
       if ($102) {
        _abort();
        // unreachable;
       } else {
        $$pre$phiZ2D = $99;$F4$0 = $100;
       }
      }
      HEAP32[$$pre$phiZ2D>>2] = $90;
      $103 = (($F4$0) + 12|0);
      HEAP32[$103>>2] = $90;
      $104 = (($90) + 8|0);
      HEAP32[$104>>2] = $F4$0;
      $105 = (($90) + 12|0);
      HEAP32[$105>>2] = $93;
     }
     HEAP32[((6680 + 8|0))>>2] = $81;
     HEAP32[((6680 + 20|0))>>2] = $84;
     $mem$0 = $69;
     return ($mem$0|0);
    }
    $106 = HEAP32[((6680 + 4|0))>>2]|0;
    $107 = ($106|0)==(0);
    if ($107) {
     $nb$0 = $5;
    } else {
     $108 = (0 - ($106))|0;
     $109 = $106 & $108;
     $110 = (($109) + -1)|0;
     $111 = $110 >>> 12;
     $112 = $111 & 16;
     $113 = $110 >>> $112;
     $114 = $113 >>> 5;
     $115 = $114 & 8;
     $116 = $115 | $112;
     $117 = $113 >>> $115;
     $118 = $117 >>> 2;
     $119 = $118 & 4;
     $120 = $116 | $119;
     $121 = $117 >>> $119;
     $122 = $121 >>> 1;
     $123 = $122 & 2;
     $124 = $120 | $123;
     $125 = $121 >>> $123;
     $126 = $125 >>> 1;
     $127 = $126 & 1;
     $128 = $124 | $127;
     $129 = $125 >>> $127;
     $130 = (($128) + ($129))|0;
     $131 = ((6680 + ($130<<2)|0) + 304|0);
     $132 = HEAP32[$131>>2]|0;
     $133 = (($132) + 4|0);
     $134 = HEAP32[$133>>2]|0;
     $135 = $134 & -8;
     $136 = (($135) - ($5))|0;
     $rsize$0$i = $136;$t$0$i = $132;$v$0$i = $132;
     while(1) {
      $137 = (($t$0$i) + 16|0);
      $138 = HEAP32[$137>>2]|0;
      $139 = ($138|0)==(0|0);
      if ($139) {
       $140 = (($t$0$i) + 20|0);
       $141 = HEAP32[$140>>2]|0;
       $142 = ($141|0)==(0|0);
       if ($142) {
        $rsize$0$i$lcssa = $rsize$0$i;$v$0$i$lcssa = $v$0$i;
        break;
       } else {
        $144 = $141;
       }
      } else {
       $144 = $138;
      }
      $143 = (($144) + 4|0);
      $145 = HEAP32[$143>>2]|0;
      $146 = $145 & -8;
      $147 = (($146) - ($5))|0;
      $148 = ($147>>>0)<($rsize$0$i>>>0);
      $$rsize$0$i = $148 ? $147 : $rsize$0$i;
      $$v$0$i = $148 ? $144 : $v$0$i;
      $rsize$0$i = $$rsize$0$i;$t$0$i = $144;$v$0$i = $$v$0$i;
     }
     $149 = HEAP32[((6680 + 16|0))>>2]|0;
     $150 = ($v$0$i$lcssa>>>0)<($149>>>0);
     if ($150) {
      _abort();
      // unreachable;
     }
     $151 = (($v$0$i$lcssa) + ($5)|0);
     $152 = ($v$0$i$lcssa>>>0)<($151>>>0);
     if (!($152)) {
      _abort();
      // unreachable;
     }
     $153 = (($v$0$i$lcssa) + 24|0);
     $154 = HEAP32[$153>>2]|0;
     $155 = (($v$0$i$lcssa) + 12|0);
     $156 = HEAP32[$155>>2]|0;
     $157 = ($156|0)==($v$0$i$lcssa|0);
     do {
      if ($157) {
       $167 = (($v$0$i$lcssa) + 20|0);
       $168 = HEAP32[$167>>2]|0;
       $169 = ($168|0)==(0|0);
       if ($169) {
        $170 = (($v$0$i$lcssa) + 16|0);
        $171 = HEAP32[$170>>2]|0;
        $172 = ($171|0)==(0|0);
        if ($172) {
         $R$1$i = 0;
         break;
        } else {
         $R$0$i$ph = $171;$RP$0$i$ph = $170;
        }
       } else {
        $R$0$i$ph = $168;$RP$0$i$ph = $167;
       }
       $R$0$i = $R$0$i$ph;$RP$0$i = $RP$0$i$ph;
       while(1) {
        $173 = (($R$0$i) + 20|0);
        $174 = HEAP32[$173>>2]|0;
        $175 = ($174|0)==(0|0);
        if ($175) {
         $176 = (($R$0$i) + 16|0);
         $177 = HEAP32[$176>>2]|0;
         $178 = ($177|0)==(0|0);
         if ($178) {
          $R$0$i$lcssa = $R$0$i;$RP$0$i$lcssa = $RP$0$i;
          break;
         } else {
          $R$0$i$be = $177;$RP$0$i$be = $176;
         }
        } else {
         $R$0$i$be = $174;$RP$0$i$be = $173;
        }
        $R$0$i = $R$0$i$be;$RP$0$i = $RP$0$i$be;
       }
       $179 = ($RP$0$i$lcssa>>>0)<($149>>>0);
       if ($179) {
        _abort();
        // unreachable;
       } else {
        HEAP32[$RP$0$i$lcssa>>2] = 0;
        $R$1$i = $R$0$i$lcssa;
        break;
       }
      } else {
       $158 = (($v$0$i$lcssa) + 8|0);
       $159 = HEAP32[$158>>2]|0;
       $160 = ($159>>>0)<($149>>>0);
       if ($160) {
        _abort();
        // unreachable;
       }
       $161 = (($159) + 12|0);
       $162 = HEAP32[$161>>2]|0;
       $163 = ($162|0)==($v$0$i$lcssa|0);
       if (!($163)) {
        _abort();
        // unreachable;
       }
       $164 = (($156) + 8|0);
       $165 = HEAP32[$164>>2]|0;
       $166 = ($165|0)==($v$0$i$lcssa|0);
       if ($166) {
        HEAP32[$161>>2] = $156;
        HEAP32[$164>>2] = $159;
        $R$1$i = $156;
        break;
       } else {
        _abort();
        // unreachable;
       }
      }
     } while(0);
     $180 = ($154|0)==(0|0);
     do {
      if (!($180)) {
       $181 = (($v$0$i$lcssa) + 28|0);
       $182 = HEAP32[$181>>2]|0;
       $183 = ((6680 + ($182<<2)|0) + 304|0);
       $184 = HEAP32[$183>>2]|0;
       $185 = ($v$0$i$lcssa|0)==($184|0);
       if ($185) {
        HEAP32[$183>>2] = $R$1$i;
        $cond$i = ($R$1$i|0)==(0|0);
        if ($cond$i) {
         $186 = 1 << $182;
         $187 = $186 ^ -1;
         $188 = HEAP32[((6680 + 4|0))>>2]|0;
         $189 = $188 & $187;
         HEAP32[((6680 + 4|0))>>2] = $189;
         break;
        }
       } else {
        $190 = HEAP32[((6680 + 16|0))>>2]|0;
        $191 = ($154>>>0)<($190>>>0);
        if ($191) {
         _abort();
         // unreachable;
        }
        $192 = (($154) + 16|0);
        $193 = HEAP32[$192>>2]|0;
        $194 = ($193|0)==($v$0$i$lcssa|0);
        if ($194) {
         HEAP32[$192>>2] = $R$1$i;
        } else {
         $195 = (($154) + 20|0);
         HEAP32[$195>>2] = $R$1$i;
        }
        $196 = ($R$1$i|0)==(0|0);
        if ($196) {
         break;
        }
       }
       $197 = HEAP32[((6680 + 16|0))>>2]|0;
       $198 = ($R$1$i>>>0)<($197>>>0);
       if ($198) {
        _abort();
        // unreachable;
       }
       $199 = (($R$1$i) + 24|0);
       HEAP32[$199>>2] = $154;
       $200 = (($v$0$i$lcssa) + 16|0);
       $201 = HEAP32[$200>>2]|0;
       $202 = ($201|0)==(0|0);
       do {
        if (!($202)) {
         $203 = ($201>>>0)<($197>>>0);
         if ($203) {
          _abort();
          // unreachable;
         } else {
          $204 = (($R$1$i) + 16|0);
          HEAP32[$204>>2] = $201;
          $205 = (($201) + 24|0);
          HEAP32[$205>>2] = $R$1$i;
          break;
         }
        }
       } while(0);
       $206 = (($v$0$i$lcssa) + 20|0);
       $207 = HEAP32[$206>>2]|0;
       $208 = ($207|0)==(0|0);
       if (!($208)) {
        $209 = HEAP32[((6680 + 16|0))>>2]|0;
        $210 = ($207>>>0)<($209>>>0);
        if ($210) {
         _abort();
         // unreachable;
        } else {
         $211 = (($R$1$i) + 20|0);
         HEAP32[$211>>2] = $207;
         $212 = (($207) + 24|0);
         HEAP32[$212>>2] = $R$1$i;
         break;
        }
       }
      }
     } while(0);
     $213 = ($rsize$0$i$lcssa>>>0)<(16);
     if ($213) {
      $214 = (($rsize$0$i$lcssa) + ($5))|0;
      $215 = $214 | 3;
      $216 = (($v$0$i$lcssa) + 4|0);
      HEAP32[$216>>2] = $215;
      $$sum4$i = (($214) + 4)|0;
      $217 = (($v$0$i$lcssa) + ($$sum4$i)|0);
      $218 = HEAP32[$217>>2]|0;
      $219 = $218 | 1;
      HEAP32[$217>>2] = $219;
     } else {
      $220 = $5 | 3;
      $221 = (($v$0$i$lcssa) + 4|0);
      HEAP32[$221>>2] = $220;
      $222 = $rsize$0$i$lcssa | 1;
      $$sum$i39 = $5 | 4;
      $223 = (($v$0$i$lcssa) + ($$sum$i39)|0);
      HEAP32[$223>>2] = $222;
      $$sum1$i = (($rsize$0$i$lcssa) + ($5))|0;
      $224 = (($v$0$i$lcssa) + ($$sum1$i)|0);
      HEAP32[$224>>2] = $rsize$0$i$lcssa;
      $225 = HEAP32[((6680 + 8|0))>>2]|0;
      $226 = ($225|0)==(0);
      if (!($226)) {
       $227 = HEAP32[((6680 + 20|0))>>2]|0;
       $228 = $225 >>> 3;
       $229 = $228 << 1;
       $230 = ((6680 + ($229<<2)|0) + 40|0);
       $231 = HEAP32[6680>>2]|0;
       $232 = 1 << $228;
       $233 = $231 & $232;
       $234 = ($233|0)==(0);
       if ($234) {
        $235 = $231 | $232;
        HEAP32[6680>>2] = $235;
        $$sum2$pre$i = (($229) + 2)|0;
        $$pre$i = ((6680 + ($$sum2$pre$i<<2)|0) + 40|0);
        $$pre$phi$iZ2D = $$pre$i;$F1$0$i = $230;
       } else {
        $$sum3$i = (($229) + 2)|0;
        $236 = ((6680 + ($$sum3$i<<2)|0) + 40|0);
        $237 = HEAP32[$236>>2]|0;
        $238 = HEAP32[((6680 + 16|0))>>2]|0;
        $239 = ($237>>>0)<($238>>>0);
        if ($239) {
         _abort();
         // unreachable;
        } else {
         $$pre$phi$iZ2D = $236;$F1$0$i = $237;
        }
       }
       HEAP32[$$pre$phi$iZ2D>>2] = $227;
       $240 = (($F1$0$i) + 12|0);
       HEAP32[$240>>2] = $227;
       $241 = (($227) + 8|0);
       HEAP32[$241>>2] = $F1$0$i;
       $242 = (($227) + 12|0);
       HEAP32[$242>>2] = $230;
      }
      HEAP32[((6680 + 8|0))>>2] = $rsize$0$i$lcssa;
      HEAP32[((6680 + 20|0))>>2] = $151;
     }
     $243 = (($v$0$i$lcssa) + 8|0);
     $mem$0 = $243;
     return ($mem$0|0);
    }
   } else {
    $nb$0 = $5;
   }
  } else {
   $244 = ($bytes>>>0)>(4294967231);
   if ($244) {
    $nb$0 = -1;
   } else {
    $245 = (($bytes) + 11)|0;
    $246 = $245 & -8;
    $247 = HEAP32[((6680 + 4|0))>>2]|0;
    $248 = ($247|0)==(0);
    if ($248) {
     $nb$0 = $246;
    } else {
     $249 = (0 - ($246))|0;
     $250 = $245 >>> 8;
     $251 = ($250|0)==(0);
     if ($251) {
      $idx$0$i = 0;
     } else {
      $252 = ($246>>>0)>(16777215);
      if ($252) {
       $idx$0$i = 31;
      } else {
       $253 = (($250) + 1048320)|0;
       $254 = $253 >>> 16;
       $255 = $254 & 8;
       $256 = $250 << $255;
       $257 = (($256) + 520192)|0;
       $258 = $257 >>> 16;
       $259 = $258 & 4;
       $260 = $259 | $255;
       $261 = $256 << $259;
       $262 = (($261) + 245760)|0;
       $263 = $262 >>> 16;
       $264 = $263 & 2;
       $265 = $260 | $264;
       $266 = (14 - ($265))|0;
       $267 = $261 << $264;
       $268 = $267 >>> 15;
       $269 = (($266) + ($268))|0;
       $270 = $269 << 1;
       $271 = (($269) + 7)|0;
       $272 = $246 >>> $271;
       $273 = $272 & 1;
       $274 = $273 | $270;
       $idx$0$i = $274;
      }
     }
     $275 = ((6680 + ($idx$0$i<<2)|0) + 304|0);
     $276 = HEAP32[$275>>2]|0;
     $277 = ($276|0)==(0|0);
     if ($277) {
      $rsize$2$i = $249;$t$1$i = 0;$v$2$i = 0;
     } else {
      $278 = ($idx$0$i|0)==(31);
      if ($278) {
       $282 = 0;
      } else {
       $279 = $idx$0$i >>> 1;
       $280 = (25 - ($279))|0;
       $282 = $280;
      }
      $281 = $246 << $282;
      $rsize$0$i15 = $249;$rst$0$i = 0;$sizebits$0$i = $281;$t$0$i14 = $276;$v$0$i16 = 0;
      while(1) {
       $283 = (($t$0$i14) + 4|0);
       $284 = HEAP32[$283>>2]|0;
       $285 = $284 & -8;
       $286 = (($285) - ($246))|0;
       $287 = ($286>>>0)<($rsize$0$i15>>>0);
       if ($287) {
        $288 = ($285|0)==($246|0);
        if ($288) {
         $rsize$2$i$ph = $286;$t$1$i$ph = $t$0$i14;$v$2$i$ph = $t$0$i14;
         break;
        } else {
         $rsize$1$i = $286;$v$1$i = $t$0$i14;
        }
       } else {
        $rsize$1$i = $rsize$0$i15;$v$1$i = $v$0$i16;
       }
       $289 = (($t$0$i14) + 20|0);
       $290 = HEAP32[$289>>2]|0;
       $291 = $sizebits$0$i >>> 31;
       $292 = ((($t$0$i14) + ($291<<2)|0) + 16|0);
       $293 = HEAP32[$292>>2]|0;
       $294 = ($290|0)==(0|0);
       $295 = ($290|0)==($293|0);
       $or$cond19$i = $294 | $295;
       $rst$1$i = $or$cond19$i ? $rst$0$i : $290;
       $296 = ($293|0)==(0|0);
       $297 = $sizebits$0$i << 1;
       if ($296) {
        $rsize$2$i$ph = $rsize$1$i;$t$1$i$ph = $rst$1$i;$v$2$i$ph = $v$1$i;
        break;
       } else {
        $rsize$0$i15 = $rsize$1$i;$rst$0$i = $rst$1$i;$sizebits$0$i = $297;$t$0$i14 = $293;$v$0$i16 = $v$1$i;
       }
      }
      $rsize$2$i = $rsize$2$i$ph;$t$1$i = $t$1$i$ph;$v$2$i = $v$2$i$ph;
     }
     $298 = ($t$1$i|0)==(0|0);
     $299 = ($v$2$i|0)==(0|0);
     $or$cond$i = $298 & $299;
     if ($or$cond$i) {
      $300 = 2 << $idx$0$i;
      $301 = (0 - ($300))|0;
      $302 = $300 | $301;
      $303 = $247 & $302;
      $304 = ($303|0)==(0);
      if ($304) {
       $nb$0 = $246;
       break;
      }
      $305 = (0 - ($303))|0;
      $306 = $303 & $305;
      $307 = (($306) + -1)|0;
      $308 = $307 >>> 12;
      $309 = $308 & 16;
      $310 = $307 >>> $309;
      $311 = $310 >>> 5;
      $312 = $311 & 8;
      $313 = $312 | $309;
      $314 = $310 >>> $312;
      $315 = $314 >>> 2;
      $316 = $315 & 4;
      $317 = $313 | $316;
      $318 = $314 >>> $316;
      $319 = $318 >>> 1;
      $320 = $319 & 2;
      $321 = $317 | $320;
      $322 = $318 >>> $320;
      $323 = $322 >>> 1;
      $324 = $323 & 1;
      $325 = $321 | $324;
      $326 = $322 >>> $324;
      $327 = (($325) + ($326))|0;
      $328 = ((6680 + ($327<<2)|0) + 304|0);
      $329 = HEAP32[$328>>2]|0;
      $t$2$ph$i = $329;
     } else {
      $t$2$ph$i = $t$1$i;
     }
     $330 = ($t$2$ph$i|0)==(0|0);
     if ($330) {
      $rsize$3$lcssa$i = $rsize$2$i;$v$3$lcssa$i = $v$2$i;
     } else {
      $rsize$331$i = $rsize$2$i;$t$230$i = $t$2$ph$i;$v$332$i = $v$2$i;
      while(1) {
       $331 = (($t$230$i) + 4|0);
       $332 = HEAP32[$331>>2]|0;
       $333 = $332 & -8;
       $334 = (($333) - ($246))|0;
       $335 = ($334>>>0)<($rsize$331$i>>>0);
       $$rsize$3$i = $335 ? $334 : $rsize$331$i;
       $t$2$v$3$i = $335 ? $t$230$i : $v$332$i;
       $336 = (($t$230$i) + 16|0);
       $337 = HEAP32[$336>>2]|0;
       $338 = ($337|0)==(0|0);
       if ($338) {
        $339 = (($t$230$i) + 20|0);
        $340 = HEAP32[$339>>2]|0;
        $341 = ($340|0)==(0|0);
        if ($341) {
         $$rsize$3$i$lcssa = $$rsize$3$i;$t$2$v$3$i$lcssa = $t$2$v$3$i;
         break;
        } else {
         $t$230$i$be = $340;
        }
       } else {
        $t$230$i$be = $337;
       }
       $rsize$331$i = $$rsize$3$i;$t$230$i = $t$230$i$be;$v$332$i = $t$2$v$3$i;
      }
      $rsize$3$lcssa$i = $$rsize$3$i$lcssa;$v$3$lcssa$i = $t$2$v$3$i$lcssa;
     }
     $342 = ($v$3$lcssa$i|0)==(0|0);
     if ($342) {
      $nb$0 = $246;
     } else {
      $343 = HEAP32[((6680 + 8|0))>>2]|0;
      $344 = (($343) - ($246))|0;
      $345 = ($rsize$3$lcssa$i>>>0)<($344>>>0);
      if ($345) {
       $346 = HEAP32[((6680 + 16|0))>>2]|0;
       $347 = ($v$3$lcssa$i>>>0)<($346>>>0);
       if ($347) {
        _abort();
        // unreachable;
       }
       $348 = (($v$3$lcssa$i) + ($246)|0);
       $349 = ($v$3$lcssa$i>>>0)<($348>>>0);
       if (!($349)) {
        _abort();
        // unreachable;
       }
       $350 = (($v$3$lcssa$i) + 24|0);
       $351 = HEAP32[$350>>2]|0;
       $352 = (($v$3$lcssa$i) + 12|0);
       $353 = HEAP32[$352>>2]|0;
       $354 = ($353|0)==($v$3$lcssa$i|0);
       do {
        if ($354) {
         $364 = (($v$3$lcssa$i) + 20|0);
         $365 = HEAP32[$364>>2]|0;
         $366 = ($365|0)==(0|0);
         if ($366) {
          $367 = (($v$3$lcssa$i) + 16|0);
          $368 = HEAP32[$367>>2]|0;
          $369 = ($368|0)==(0|0);
          if ($369) {
           $R$1$i20 = 0;
           break;
          } else {
           $R$0$i18$ph = $368;$RP$0$i17$ph = $367;
          }
         } else {
          $R$0$i18$ph = $365;$RP$0$i17$ph = $364;
         }
         $R$0$i18 = $R$0$i18$ph;$RP$0$i17 = $RP$0$i17$ph;
         while(1) {
          $370 = (($R$0$i18) + 20|0);
          $371 = HEAP32[$370>>2]|0;
          $372 = ($371|0)==(0|0);
          if ($372) {
           $373 = (($R$0$i18) + 16|0);
           $374 = HEAP32[$373>>2]|0;
           $375 = ($374|0)==(0|0);
           if ($375) {
            $R$0$i18$lcssa = $R$0$i18;$RP$0$i17$lcssa = $RP$0$i17;
            break;
           } else {
            $R$0$i18$be = $374;$RP$0$i17$be = $373;
           }
          } else {
           $R$0$i18$be = $371;$RP$0$i17$be = $370;
          }
          $R$0$i18 = $R$0$i18$be;$RP$0$i17 = $RP$0$i17$be;
         }
         $376 = ($RP$0$i17$lcssa>>>0)<($346>>>0);
         if ($376) {
          _abort();
          // unreachable;
         } else {
          HEAP32[$RP$0$i17$lcssa>>2] = 0;
          $R$1$i20 = $R$0$i18$lcssa;
          break;
         }
        } else {
         $355 = (($v$3$lcssa$i) + 8|0);
         $356 = HEAP32[$355>>2]|0;
         $357 = ($356>>>0)<($346>>>0);
         if ($357) {
          _abort();
          // unreachable;
         }
         $358 = (($356) + 12|0);
         $359 = HEAP32[$358>>2]|0;
         $360 = ($359|0)==($v$3$lcssa$i|0);
         if (!($360)) {
          _abort();
          // unreachable;
         }
         $361 = (($353) + 8|0);
         $362 = HEAP32[$361>>2]|0;
         $363 = ($362|0)==($v$3$lcssa$i|0);
         if ($363) {
          HEAP32[$358>>2] = $353;
          HEAP32[$361>>2] = $356;
          $R$1$i20 = $353;
          break;
         } else {
          _abort();
          // unreachable;
         }
        }
       } while(0);
       $377 = ($351|0)==(0|0);
       do {
        if (!($377)) {
         $378 = (($v$3$lcssa$i) + 28|0);
         $379 = HEAP32[$378>>2]|0;
         $380 = ((6680 + ($379<<2)|0) + 304|0);
         $381 = HEAP32[$380>>2]|0;
         $382 = ($v$3$lcssa$i|0)==($381|0);
         if ($382) {
          HEAP32[$380>>2] = $R$1$i20;
          $cond$i21 = ($R$1$i20|0)==(0|0);
          if ($cond$i21) {
           $383 = 1 << $379;
           $384 = $383 ^ -1;
           $385 = HEAP32[((6680 + 4|0))>>2]|0;
           $386 = $385 & $384;
           HEAP32[((6680 + 4|0))>>2] = $386;
           break;
          }
         } else {
          $387 = HEAP32[((6680 + 16|0))>>2]|0;
          $388 = ($351>>>0)<($387>>>0);
          if ($388) {
           _abort();
           // unreachable;
          }
          $389 = (($351) + 16|0);
          $390 = HEAP32[$389>>2]|0;
          $391 = ($390|0)==($v$3$lcssa$i|0);
          if ($391) {
           HEAP32[$389>>2] = $R$1$i20;
          } else {
           $392 = (($351) + 20|0);
           HEAP32[$392>>2] = $R$1$i20;
          }
          $393 = ($R$1$i20|0)==(0|0);
          if ($393) {
           break;
          }
         }
         $394 = HEAP32[((6680 + 16|0))>>2]|0;
         $395 = ($R$1$i20>>>0)<($394>>>0);
         if ($395) {
          _abort();
          // unreachable;
         }
         $396 = (($R$1$i20) + 24|0);
         HEAP32[$396>>2] = $351;
         $397 = (($v$3$lcssa$i) + 16|0);
         $398 = HEAP32[$397>>2]|0;
         $399 = ($398|0)==(0|0);
         do {
          if (!($399)) {
           $400 = ($398>>>0)<($394>>>0);
           if ($400) {
            _abort();
            // unreachable;
           } else {
            $401 = (($R$1$i20) + 16|0);
            HEAP32[$401>>2] = $398;
            $402 = (($398) + 24|0);
            HEAP32[$402>>2] = $R$1$i20;
            break;
           }
          }
         } while(0);
         $403 = (($v$3$lcssa$i) + 20|0);
         $404 = HEAP32[$403>>2]|0;
         $405 = ($404|0)==(0|0);
         if (!($405)) {
          $406 = HEAP32[((6680 + 16|0))>>2]|0;
          $407 = ($404>>>0)<($406>>>0);
          if ($407) {
           _abort();
           // unreachable;
          } else {
           $408 = (($R$1$i20) + 20|0);
           HEAP32[$408>>2] = $404;
           $409 = (($404) + 24|0);
           HEAP32[$409>>2] = $R$1$i20;
           break;
          }
         }
        }
       } while(0);
       $410 = ($rsize$3$lcssa$i>>>0)<(16);
       L215: do {
        if ($410) {
         $411 = (($rsize$3$lcssa$i) + ($246))|0;
         $412 = $411 | 3;
         $413 = (($v$3$lcssa$i) + 4|0);
         HEAP32[$413>>2] = $412;
         $$sum18$i = (($411) + 4)|0;
         $414 = (($v$3$lcssa$i) + ($$sum18$i)|0);
         $415 = HEAP32[$414>>2]|0;
         $416 = $415 | 1;
         HEAP32[$414>>2] = $416;
        } else {
         $417 = $246 | 3;
         $418 = (($v$3$lcssa$i) + 4|0);
         HEAP32[$418>>2] = $417;
         $419 = $rsize$3$lcssa$i | 1;
         $$sum$i2338 = $246 | 4;
         $420 = (($v$3$lcssa$i) + ($$sum$i2338)|0);
         HEAP32[$420>>2] = $419;
         $$sum1$i24 = (($rsize$3$lcssa$i) + ($246))|0;
         $421 = (($v$3$lcssa$i) + ($$sum1$i24)|0);
         HEAP32[$421>>2] = $rsize$3$lcssa$i;
         $422 = $rsize$3$lcssa$i >>> 3;
         $423 = ($rsize$3$lcssa$i>>>0)<(256);
         if ($423) {
          $424 = $422 << 1;
          $425 = ((6680 + ($424<<2)|0) + 40|0);
          $426 = HEAP32[6680>>2]|0;
          $427 = 1 << $422;
          $428 = $426 & $427;
          $429 = ($428|0)==(0);
          do {
           if ($429) {
            $430 = $426 | $427;
            HEAP32[6680>>2] = $430;
            $$sum14$pre$i = (($424) + 2)|0;
            $$pre$i25 = ((6680 + ($$sum14$pre$i<<2)|0) + 40|0);
            $$pre$phi$i26Z2D = $$pre$i25;$F5$0$i = $425;
           } else {
            $$sum17$i = (($424) + 2)|0;
            $431 = ((6680 + ($$sum17$i<<2)|0) + 40|0);
            $432 = HEAP32[$431>>2]|0;
            $433 = HEAP32[((6680 + 16|0))>>2]|0;
            $434 = ($432>>>0)<($433>>>0);
            if (!($434)) {
             $$pre$phi$i26Z2D = $431;$F5$0$i = $432;
             break;
            }
            _abort();
            // unreachable;
           }
          } while(0);
          HEAP32[$$pre$phi$i26Z2D>>2] = $348;
          $435 = (($F5$0$i) + 12|0);
          HEAP32[$435>>2] = $348;
          $$sum15$i = (($246) + 8)|0;
          $436 = (($v$3$lcssa$i) + ($$sum15$i)|0);
          HEAP32[$436>>2] = $F5$0$i;
          $$sum16$i = (($246) + 12)|0;
          $437 = (($v$3$lcssa$i) + ($$sum16$i)|0);
          HEAP32[$437>>2] = $425;
          break;
         }
         $438 = $rsize$3$lcssa$i >>> 8;
         $439 = ($438|0)==(0);
         if ($439) {
          $I7$0$i = 0;
         } else {
          $440 = ($rsize$3$lcssa$i>>>0)>(16777215);
          if ($440) {
           $I7$0$i = 31;
          } else {
           $441 = (($438) + 1048320)|0;
           $442 = $441 >>> 16;
           $443 = $442 & 8;
           $444 = $438 << $443;
           $445 = (($444) + 520192)|0;
           $446 = $445 >>> 16;
           $447 = $446 & 4;
           $448 = $447 | $443;
           $449 = $444 << $447;
           $450 = (($449) + 245760)|0;
           $451 = $450 >>> 16;
           $452 = $451 & 2;
           $453 = $448 | $452;
           $454 = (14 - ($453))|0;
           $455 = $449 << $452;
           $456 = $455 >>> 15;
           $457 = (($454) + ($456))|0;
           $458 = $457 << 1;
           $459 = (($457) + 7)|0;
           $460 = $rsize$3$lcssa$i >>> $459;
           $461 = $460 & 1;
           $462 = $461 | $458;
           $I7$0$i = $462;
          }
         }
         $463 = ((6680 + ($I7$0$i<<2)|0) + 304|0);
         $$sum2$i = (($246) + 28)|0;
         $464 = (($v$3$lcssa$i) + ($$sum2$i)|0);
         HEAP32[$464>>2] = $I7$0$i;
         $$sum3$i27 = (($246) + 16)|0;
         $465 = (($v$3$lcssa$i) + ($$sum3$i27)|0);
         $$sum4$i28 = (($246) + 20)|0;
         $466 = (($v$3$lcssa$i) + ($$sum4$i28)|0);
         HEAP32[$466>>2] = 0;
         HEAP32[$465>>2] = 0;
         $467 = HEAP32[((6680 + 4|0))>>2]|0;
         $468 = 1 << $I7$0$i;
         $469 = $467 & $468;
         $470 = ($469|0)==(0);
         if ($470) {
          $471 = $467 | $468;
          HEAP32[((6680 + 4|0))>>2] = $471;
          HEAP32[$463>>2] = $348;
          $$sum5$i = (($246) + 24)|0;
          $472 = (($v$3$lcssa$i) + ($$sum5$i)|0);
          HEAP32[$472>>2] = $463;
          $$sum6$i = (($246) + 12)|0;
          $473 = (($v$3$lcssa$i) + ($$sum6$i)|0);
          HEAP32[$473>>2] = $348;
          $$sum7$i = (($246) + 8)|0;
          $474 = (($v$3$lcssa$i) + ($$sum7$i)|0);
          HEAP32[$474>>2] = $348;
          break;
         }
         $475 = HEAP32[$463>>2]|0;
         $476 = ($I7$0$i|0)==(31);
         if ($476) {
          $484 = 0;
         } else {
          $477 = $I7$0$i >>> 1;
          $478 = (25 - ($477))|0;
          $484 = $478;
         }
         $479 = (($475) + 4|0);
         $480 = HEAP32[$479>>2]|0;
         $481 = $480 & -8;
         $482 = ($481|0)==($rsize$3$lcssa$i|0);
         do {
          if ($482) {
           $T$0$lcssa$i = $475;
          } else {
           $483 = $rsize$3$lcssa$i << $484;
           $K12$029$i = $483;$T$028$i = $475;
           while(1) {
            $491 = $K12$029$i >>> 31;
            $492 = ((($T$028$i) + ($491<<2)|0) + 16|0);
            $487 = HEAP32[$492>>2]|0;
            $493 = ($487|0)==(0|0);
            if ($493) {
             $$lcssa134 = $492;$T$028$i$lcssa = $T$028$i;
             break;
            }
            $485 = $K12$029$i << 1;
            $486 = (($487) + 4|0);
            $488 = HEAP32[$486>>2]|0;
            $489 = $488 & -8;
            $490 = ($489|0)==($rsize$3$lcssa$i|0);
            if ($490) {
             $$lcssa137 = $487;
             label = 163;
             break;
            } else {
             $K12$029$i = $485;$T$028$i = $487;
            }
           }
           if ((label|0) == 163) {
            $T$0$lcssa$i = $$lcssa137;
            break;
           }
           $494 = HEAP32[((6680 + 16|0))>>2]|0;
           $495 = ($$lcssa134>>>0)<($494>>>0);
           if ($495) {
            _abort();
            // unreachable;
           } else {
            HEAP32[$$lcssa134>>2] = $348;
            $$sum11$i = (($246) + 24)|0;
            $496 = (($v$3$lcssa$i) + ($$sum11$i)|0);
            HEAP32[$496>>2] = $T$028$i$lcssa;
            $$sum12$i = (($246) + 12)|0;
            $497 = (($v$3$lcssa$i) + ($$sum12$i)|0);
            HEAP32[$497>>2] = $348;
            $$sum13$i = (($246) + 8)|0;
            $498 = (($v$3$lcssa$i) + ($$sum13$i)|0);
            HEAP32[$498>>2] = $348;
            break L215;
           }
          }
         } while(0);
         $499 = (($T$0$lcssa$i) + 8|0);
         $500 = HEAP32[$499>>2]|0;
         $501 = HEAP32[((6680 + 16|0))>>2]|0;
         $502 = ($T$0$lcssa$i>>>0)>=($501>>>0);
         $503 = ($500>>>0)>=($501>>>0);
         $or$cond24$i = $502 & $503;
         if ($or$cond24$i) {
          $504 = (($500) + 12|0);
          HEAP32[$504>>2] = $348;
          HEAP32[$499>>2] = $348;
          $$sum8$i = (($246) + 8)|0;
          $505 = (($v$3$lcssa$i) + ($$sum8$i)|0);
          HEAP32[$505>>2] = $500;
          $$sum9$i = (($246) + 12)|0;
          $506 = (($v$3$lcssa$i) + ($$sum9$i)|0);
          HEAP32[$506>>2] = $T$0$lcssa$i;
          $$sum10$i = (($246) + 24)|0;
          $507 = (($v$3$lcssa$i) + ($$sum10$i)|0);
          HEAP32[$507>>2] = 0;
          break;
         } else {
          _abort();
          // unreachable;
         }
        }
       } while(0);
       $508 = (($v$3$lcssa$i) + 8|0);
       $mem$0 = $508;
       return ($mem$0|0);
      } else {
       $nb$0 = $246;
      }
     }
    }
   }
  }
 } while(0);
 $509 = HEAP32[((6680 + 8|0))>>2]|0;
 $510 = ($509>>>0)<($nb$0>>>0);
 if (!($510)) {
  $511 = (($509) - ($nb$0))|0;
  $512 = HEAP32[((6680 + 20|0))>>2]|0;
  $513 = ($511>>>0)>(15);
  if ($513) {
   $514 = (($512) + ($nb$0)|0);
   HEAP32[((6680 + 20|0))>>2] = $514;
   HEAP32[((6680 + 8|0))>>2] = $511;
   $515 = $511 | 1;
   $$sum2 = (($nb$0) + 4)|0;
   $516 = (($512) + ($$sum2)|0);
   HEAP32[$516>>2] = $515;
   $517 = (($512) + ($509)|0);
   HEAP32[$517>>2] = $511;
   $518 = $nb$0 | 3;
   $519 = (($512) + 4|0);
   HEAP32[$519>>2] = $518;
  } else {
   HEAP32[((6680 + 8|0))>>2] = 0;
   HEAP32[((6680 + 20|0))>>2] = 0;
   $520 = $509 | 3;
   $521 = (($512) + 4|0);
   HEAP32[$521>>2] = $520;
   $$sum1 = (($509) + 4)|0;
   $522 = (($512) + ($$sum1)|0);
   $523 = HEAP32[$522>>2]|0;
   $524 = $523 | 1;
   HEAP32[$522>>2] = $524;
  }
  $525 = (($512) + 8|0);
  $mem$0 = $525;
  return ($mem$0|0);
 }
 $526 = HEAP32[((6680 + 12|0))>>2]|0;
 $527 = ($526>>>0)>($nb$0>>>0);
 if ($527) {
  $528 = (($526) - ($nb$0))|0;
  HEAP32[((6680 + 12|0))>>2] = $528;
  $529 = HEAP32[((6680 + 24|0))>>2]|0;
  $530 = (($529) + ($nb$0)|0);
  HEAP32[((6680 + 24|0))>>2] = $530;
  $531 = $528 | 1;
  $$sum = (($nb$0) + 4)|0;
  $532 = (($529) + ($$sum)|0);
  HEAP32[$532>>2] = $531;
  $533 = $nb$0 | 3;
  $534 = (($529) + 4|0);
  HEAP32[$534>>2] = $533;
  $535 = (($529) + 8|0);
  $mem$0 = $535;
  return ($mem$0|0);
 }
 $536 = HEAP32[7152>>2]|0;
 $537 = ($536|0)==(0);
 do {
  if ($537) {
   $538 = (_sysconf(30)|0);
   $539 = (($538) + -1)|0;
   $540 = $539 & $538;
   $541 = ($540|0)==(0);
   if ($541) {
    HEAP32[((7152 + 8|0))>>2] = $538;
    HEAP32[((7152 + 4|0))>>2] = $538;
    HEAP32[((7152 + 12|0))>>2] = -1;
    HEAP32[((7152 + 16|0))>>2] = -1;
    HEAP32[((7152 + 20|0))>>2] = 0;
    HEAP32[((6680 + 444|0))>>2] = 0;
    $542 = (_time((0|0))|0);
    $543 = $542 & -16;
    $544 = $543 ^ 1431655768;
    HEAP32[7152>>2] = $544;
    break;
   } else {
    _abort();
    // unreachable;
   }
  }
 } while(0);
 $545 = (($nb$0) + 48)|0;
 $546 = HEAP32[((7152 + 8|0))>>2]|0;
 $547 = (($nb$0) + 47)|0;
 $548 = (($546) + ($547))|0;
 $549 = (0 - ($546))|0;
 $550 = $548 & $549;
 $551 = ($550>>>0)>($nb$0>>>0);
 if (!($551)) {
  $mem$0 = 0;
  return ($mem$0|0);
 }
 $552 = HEAP32[((6680 + 440|0))>>2]|0;
 $553 = ($552|0)==(0);
 if (!($553)) {
  $554 = HEAP32[((6680 + 432|0))>>2]|0;
  $555 = (($554) + ($550))|0;
  $556 = ($555>>>0)<=($554>>>0);
  $557 = ($555>>>0)>($552>>>0);
  $or$cond1$i = $556 | $557;
  if ($or$cond1$i) {
   $mem$0 = 0;
   return ($mem$0|0);
  }
 }
 $558 = HEAP32[((6680 + 444|0))>>2]|0;
 $559 = $558 & 4;
 $560 = ($559|0)==(0);
 L279: do {
  if ($560) {
   $561 = HEAP32[((6680 + 24|0))>>2]|0;
   $562 = ($561|0)==(0|0);
   do {
    if ($562) {
     label = 191;
    } else {
     $sp$0$i$i = ((6680 + 448|0));
     while(1) {
      $563 = HEAP32[$sp$0$i$i>>2]|0;
      $564 = ($563>>>0)>($561>>>0);
      if (!($564)) {
       $565 = (($sp$0$i$i) + 4|0);
       $566 = HEAP32[$565>>2]|0;
       $567 = (($563) + ($566)|0);
       $568 = ($567>>>0)>($561>>>0);
       if ($568) {
        $$lcssa130 = $sp$0$i$i;$$lcssa132 = $565;$sp$0$i$i$lcssa = $sp$0$i$i;
        break;
       }
      }
      $569 = (($sp$0$i$i) + 8|0);
      $570 = HEAP32[$569>>2]|0;
      $571 = ($570|0)==(0|0);
      if ($571) {
       label = 190;
       break;
      } else {
       $sp$0$i$i = $570;
      }
     }
     if ((label|0) == 190) {
      label = 191;
      break;
     }
     $572 = ($sp$0$i$i$lcssa|0)==(0|0);
     if ($572) {
      label = 191;
     } else {
      $595 = HEAP32[((6680 + 12|0))>>2]|0;
      $596 = (($548) - ($595))|0;
      $597 = $596 & $549;
      $598 = ($597>>>0)<(2147483647);
      if ($598) {
       $599 = (_sbrk(($597|0))|0);
       $600 = HEAP32[$$lcssa130>>2]|0;
       $601 = HEAP32[$$lcssa132>>2]|0;
       $602 = (($600) + ($601)|0);
       $603 = ($599|0)==($602|0);
       if ($603) {
        $br$0$i = $599;$ssize$1$i = $597;
        label = 200;
       } else {
        $br$030$i = $599;$ssize$129$i = $597;
        label = 201;
       }
      } else {
       $tsize$03141$i = 0;
      }
     }
    }
   } while(0);
   do {
    if ((label|0) == 191) {
     $573 = (_sbrk(0)|0);
     $574 = ($573|0)==((-1)|0);
     if ($574) {
      $tsize$03141$i = 0;
     } else {
      $575 = $573;
      $576 = HEAP32[((7152 + 4|0))>>2]|0;
      $577 = (($576) + -1)|0;
      $578 = $577 & $575;
      $579 = ($578|0)==(0);
      if ($579) {
       $ssize$0$i = $550;
      } else {
       $580 = (($577) + ($575))|0;
       $581 = (0 - ($576))|0;
       $582 = $580 & $581;
       $583 = (($550) - ($575))|0;
       $584 = (($583) + ($582))|0;
       $ssize$0$i = $584;
      }
      $585 = HEAP32[((6680 + 432|0))>>2]|0;
      $586 = (($585) + ($ssize$0$i))|0;
      $587 = ($ssize$0$i>>>0)>($nb$0>>>0);
      $588 = ($ssize$0$i>>>0)<(2147483647);
      $or$cond$i29 = $587 & $588;
      if ($or$cond$i29) {
       $589 = HEAP32[((6680 + 440|0))>>2]|0;
       $590 = ($589|0)==(0);
       if (!($590)) {
        $591 = ($586>>>0)<=($585>>>0);
        $592 = ($586>>>0)>($589>>>0);
        $or$cond2$i = $591 | $592;
        if ($or$cond2$i) {
         $tsize$03141$i = 0;
         break;
        }
       }
       $593 = (_sbrk(($ssize$0$i|0))|0);
       $594 = ($593|0)==($573|0);
       if ($594) {
        $br$0$i = $573;$ssize$1$i = $ssize$0$i;
        label = 200;
       } else {
        $br$030$i = $593;$ssize$129$i = $ssize$0$i;
        label = 201;
       }
      } else {
       $tsize$03141$i = 0;
      }
     }
    }
   } while(0);
   L303: do {
    if ((label|0) == 200) {
     $604 = ($br$0$i|0)==((-1)|0);
     if ($604) {
      $tsize$03141$i = $ssize$1$i;
     } else {
      $tbase$245$i = $br$0$i;$tsize$244$i = $ssize$1$i;
      label = 211;
      break L279;
     }
    }
    else if ((label|0) == 201) {
     $605 = (0 - ($ssize$129$i))|0;
     $606 = ($br$030$i|0)!=((-1)|0);
     $607 = ($ssize$129$i>>>0)<(2147483647);
     $or$cond5$i = $606 & $607;
     $608 = ($545>>>0)>($ssize$129$i>>>0);
     $or$cond4$i = $or$cond5$i & $608;
     do {
      if ($or$cond4$i) {
       $609 = HEAP32[((7152 + 8|0))>>2]|0;
       $610 = (($547) - ($ssize$129$i))|0;
       $611 = (($610) + ($609))|0;
       $612 = (0 - ($609))|0;
       $613 = $611 & $612;
       $614 = ($613>>>0)<(2147483647);
       if ($614) {
        $615 = (_sbrk(($613|0))|0);
        $616 = ($615|0)==((-1)|0);
        if ($616) {
         (_sbrk(($605|0))|0);
         $tsize$03141$i = 0;
         break L303;
        } else {
         $617 = (($613) + ($ssize$129$i))|0;
         $ssize$2$i = $617;
         break;
        }
       } else {
        $ssize$2$i = $ssize$129$i;
       }
      } else {
       $ssize$2$i = $ssize$129$i;
      }
     } while(0);
     $618 = ($br$030$i|0)==((-1)|0);
     if ($618) {
      $tsize$03141$i = 0;
     } else {
      $tbase$245$i = $br$030$i;$tsize$244$i = $ssize$2$i;
      label = 211;
      break L279;
     }
    }
   } while(0);
   $619 = HEAP32[((6680 + 444|0))>>2]|0;
   $620 = $619 | 4;
   HEAP32[((6680 + 444|0))>>2] = $620;
   $tsize$1$i = $tsize$03141$i;
   label = 208;
  } else {
   $tsize$1$i = 0;
   label = 208;
  }
 } while(0);
 if ((label|0) == 208) {
  $621 = ($550>>>0)<(2147483647);
  if ($621) {
   $622 = (_sbrk(($550|0))|0);
   $623 = (_sbrk(0)|0);
   $624 = ($622|0)!=((-1)|0);
   $625 = ($623|0)!=((-1)|0);
   $or$cond3$i = $624 & $625;
   $626 = ($622>>>0)<($623>>>0);
   $or$cond6$i = $or$cond3$i & $626;
   if ($or$cond6$i) {
    $627 = $623;
    $628 = $622;
    $629 = (($627) - ($628))|0;
    $630 = (($nb$0) + 40)|0;
    $631 = ($629>>>0)>($630>>>0);
    $$tsize$1$i = $631 ? $629 : $tsize$1$i;
    if ($631) {
     $tbase$245$i = $622;$tsize$244$i = $$tsize$1$i;
     label = 211;
    }
   }
  }
 }
 if ((label|0) == 211) {
  $632 = HEAP32[((6680 + 432|0))>>2]|0;
  $633 = (($632) + ($tsize$244$i))|0;
  HEAP32[((6680 + 432|0))>>2] = $633;
  $634 = HEAP32[((6680 + 436|0))>>2]|0;
  $635 = ($633>>>0)>($634>>>0);
  if ($635) {
   HEAP32[((6680 + 436|0))>>2] = $633;
  }
  $636 = HEAP32[((6680 + 24|0))>>2]|0;
  $637 = ($636|0)==(0|0);
  L323: do {
   if ($637) {
    $638 = HEAP32[((6680 + 16|0))>>2]|0;
    $639 = ($638|0)==(0|0);
    $640 = ($tbase$245$i>>>0)<($638>>>0);
    $or$cond8$i = $639 | $640;
    if ($or$cond8$i) {
     HEAP32[((6680 + 16|0))>>2] = $tbase$245$i;
    }
    HEAP32[((6680 + 448|0))>>2] = $tbase$245$i;
    HEAP32[((6680 + 452|0))>>2] = $tsize$244$i;
    HEAP32[((6680 + 460|0))>>2] = 0;
    $641 = HEAP32[7152>>2]|0;
    HEAP32[((6680 + 36|0))>>2] = $641;
    HEAP32[((6680 + 32|0))>>2] = -1;
    $i$02$i$i = 0;
    while(1) {
     $642 = $i$02$i$i << 1;
     $643 = ((6680 + ($642<<2)|0) + 40|0);
     $$sum$i$i = (($642) + 3)|0;
     $644 = ((6680 + ($$sum$i$i<<2)|0) + 40|0);
     HEAP32[$644>>2] = $643;
     $$sum1$i$i = (($642) + 2)|0;
     $645 = ((6680 + ($$sum1$i$i<<2)|0) + 40|0);
     HEAP32[$645>>2] = $643;
     $646 = (($i$02$i$i) + 1)|0;
     $exitcond$i$i = ($646|0)==(32);
     if ($exitcond$i$i) {
      break;
     } else {
      $i$02$i$i = $646;
     }
    }
    $647 = (($tsize$244$i) + -40)|0;
    $648 = (($tbase$245$i) + 8|0);
    $649 = $648;
    $650 = $649 & 7;
    $651 = ($650|0)==(0);
    if ($651) {
     $655 = 0;
    } else {
     $652 = (0 - ($649))|0;
     $653 = $652 & 7;
     $655 = $653;
    }
    $654 = (($tbase$245$i) + ($655)|0);
    $656 = (($647) - ($655))|0;
    HEAP32[((6680 + 24|0))>>2] = $654;
    HEAP32[((6680 + 12|0))>>2] = $656;
    $657 = $656 | 1;
    $$sum$i12$i = (($655) + 4)|0;
    $658 = (($tbase$245$i) + ($$sum$i12$i)|0);
    HEAP32[$658>>2] = $657;
    $$sum2$i$i = (($tsize$244$i) + -36)|0;
    $659 = (($tbase$245$i) + ($$sum2$i$i)|0);
    HEAP32[$659>>2] = 40;
    $660 = HEAP32[((7152 + 16|0))>>2]|0;
    HEAP32[((6680 + 28|0))>>2] = $660;
   } else {
    $sp$074$i = ((6680 + 448|0));
    while(1) {
     $661 = HEAP32[$sp$074$i>>2]|0;
     $662 = (($sp$074$i) + 4|0);
     $663 = HEAP32[$662>>2]|0;
     $664 = (($661) + ($663)|0);
     $665 = ($tbase$245$i|0)==($664|0);
     if ($665) {
      $$lcssa123 = $661;$$lcssa125 = $662;$$lcssa127 = $663;$sp$074$i$lcssa = $sp$074$i;
      label = 224;
      break;
     }
     $666 = (($sp$074$i) + 8|0);
     $667 = HEAP32[$666>>2]|0;
     $668 = ($667|0)==(0|0);
     if ($668) {
      label = 229;
      break;
     } else {
      $sp$074$i = $667;
     }
    }
    if ((label|0) == 224) {
     $669 = (($sp$074$i$lcssa) + 12|0);
     $670 = HEAP32[$669>>2]|0;
     $671 = $670 & 8;
     $672 = ($671|0)==(0);
     if ($672) {
      $673 = ($636>>>0)>=($$lcssa123>>>0);
      $674 = ($636>>>0)<($tbase$245$i>>>0);
      $or$cond47$i = $673 & $674;
      if ($or$cond47$i) {
       $675 = (($$lcssa127) + ($tsize$244$i))|0;
       HEAP32[$$lcssa125>>2] = $675;
       $676 = HEAP32[((6680 + 12|0))>>2]|0;
       $677 = (($676) + ($tsize$244$i))|0;
       $678 = (($636) + 8|0);
       $679 = $678;
       $680 = $679 & 7;
       $681 = ($680|0)==(0);
       if ($681) {
        $685 = 0;
       } else {
        $682 = (0 - ($679))|0;
        $683 = $682 & 7;
        $685 = $683;
       }
       $684 = (($636) + ($685)|0);
       $686 = (($677) - ($685))|0;
       HEAP32[((6680 + 24|0))>>2] = $684;
       HEAP32[((6680 + 12|0))>>2] = $686;
       $687 = $686 | 1;
       $$sum$i16$i = (($685) + 4)|0;
       $688 = (($636) + ($$sum$i16$i)|0);
       HEAP32[$688>>2] = $687;
       $$sum2$i17$i = (($677) + 4)|0;
       $689 = (($636) + ($$sum2$i17$i)|0);
       HEAP32[$689>>2] = 40;
       $690 = HEAP32[((7152 + 16|0))>>2]|0;
       HEAP32[((6680 + 28|0))>>2] = $690;
       break;
      }
     }
    }
    else if ((label|0) == 229) {
    }
    $691 = HEAP32[((6680 + 16|0))>>2]|0;
    $692 = ($tbase$245$i>>>0)<($691>>>0);
    if ($692) {
     HEAP32[((6680 + 16|0))>>2] = $tbase$245$i;
     $756 = $tbase$245$i;
    } else {
     $756 = $691;
    }
    $693 = (($tbase$245$i) + ($tsize$244$i)|0);
    $sp$173$i = ((6680 + 448|0));
    while(1) {
     $694 = HEAP32[$sp$173$i>>2]|0;
     $695 = ($694|0)==($693|0);
     if ($695) {
      $$lcssa120 = $sp$173$i;$sp$173$i$lcssa = $sp$173$i;
      label = 235;
      break;
     }
     $696 = (($sp$173$i) + 8|0);
     $697 = HEAP32[$696>>2]|0;
     $698 = ($697|0)==(0|0);
     if ($698) {
      label = 319;
      break;
     } else {
      $sp$173$i = $697;
     }
    }
    if ((label|0) == 235) {
     $699 = (($sp$173$i$lcssa) + 12|0);
     $700 = HEAP32[$699>>2]|0;
     $701 = $700 & 8;
     $702 = ($701|0)==(0);
     if ($702) {
      HEAP32[$$lcssa120>>2] = $tbase$245$i;
      $703 = (($sp$173$i$lcssa) + 4|0);
      $704 = HEAP32[$703>>2]|0;
      $705 = (($704) + ($tsize$244$i))|0;
      HEAP32[$703>>2] = $705;
      $706 = (($tbase$245$i) + 8|0);
      $707 = $706;
      $708 = $707 & 7;
      $709 = ($708|0)==(0);
      if ($709) {
       $713 = 0;
      } else {
       $710 = (0 - ($707))|0;
       $711 = $710 & 7;
       $713 = $711;
      }
      $712 = (($tbase$245$i) + ($713)|0);
      $$sum102$i = (($tsize$244$i) + 8)|0;
      $714 = (($tbase$245$i) + ($$sum102$i)|0);
      $715 = $714;
      $716 = $715 & 7;
      $717 = ($716|0)==(0);
      if ($717) {
       $720 = 0;
      } else {
       $718 = (0 - ($715))|0;
       $719 = $718 & 7;
       $720 = $719;
      }
      $$sum103$i = (($720) + ($tsize$244$i))|0;
      $721 = (($tbase$245$i) + ($$sum103$i)|0);
      $722 = $721;
      $723 = $712;
      $724 = (($722) - ($723))|0;
      $$sum$i19$i = (($713) + ($nb$0))|0;
      $725 = (($tbase$245$i) + ($$sum$i19$i)|0);
      $726 = (($724) - ($nb$0))|0;
      $727 = $nb$0 | 3;
      $$sum1$i20$i = (($713) + 4)|0;
      $728 = (($tbase$245$i) + ($$sum1$i20$i)|0);
      HEAP32[$728>>2] = $727;
      $729 = ($721|0)==($636|0);
      L352: do {
       if ($729) {
        $730 = HEAP32[((6680 + 12|0))>>2]|0;
        $731 = (($730) + ($726))|0;
        HEAP32[((6680 + 12|0))>>2] = $731;
        HEAP32[((6680 + 24|0))>>2] = $725;
        $732 = $731 | 1;
        $$sum42$i$i = (($$sum$i19$i) + 4)|0;
        $733 = (($tbase$245$i) + ($$sum42$i$i)|0);
        HEAP32[$733>>2] = $732;
       } else {
        $734 = HEAP32[((6680 + 20|0))>>2]|0;
        $735 = ($721|0)==($734|0);
        if ($735) {
         $736 = HEAP32[((6680 + 8|0))>>2]|0;
         $737 = (($736) + ($726))|0;
         HEAP32[((6680 + 8|0))>>2] = $737;
         HEAP32[((6680 + 20|0))>>2] = $725;
         $738 = $737 | 1;
         $$sum40$i$i = (($$sum$i19$i) + 4)|0;
         $739 = (($tbase$245$i) + ($$sum40$i$i)|0);
         HEAP32[$739>>2] = $738;
         $$sum41$i$i = (($737) + ($$sum$i19$i))|0;
         $740 = (($tbase$245$i) + ($$sum41$i$i)|0);
         HEAP32[$740>>2] = $737;
         break;
        }
        $$sum2$i21$i = (($tsize$244$i) + 4)|0;
        $$sum104$i = (($$sum2$i21$i) + ($720))|0;
        $741 = (($tbase$245$i) + ($$sum104$i)|0);
        $742 = HEAP32[$741>>2]|0;
        $743 = $742 & 3;
        $744 = ($743|0)==(1);
        if ($744) {
         $745 = $742 & -8;
         $746 = $742 >>> 3;
         $747 = ($742>>>0)<(256);
         L360: do {
          if ($747) {
           $$sum3738$i$i = $720 | 8;
           $$sum114$i = (($$sum3738$i$i) + ($tsize$244$i))|0;
           $748 = (($tbase$245$i) + ($$sum114$i)|0);
           $749 = HEAP32[$748>>2]|0;
           $$sum39$i$i = (($tsize$244$i) + 12)|0;
           $$sum115$i = (($$sum39$i$i) + ($720))|0;
           $750 = (($tbase$245$i) + ($$sum115$i)|0);
           $751 = HEAP32[$750>>2]|0;
           $752 = $746 << 1;
           $753 = ((6680 + ($752<<2)|0) + 40|0);
           $754 = ($749|0)==($753|0);
           do {
            if (!($754)) {
             $755 = ($749>>>0)<($756>>>0);
             if ($755) {
              _abort();
              // unreachable;
             }
             $757 = (($749) + 12|0);
             $758 = HEAP32[$757>>2]|0;
             $759 = ($758|0)==($721|0);
             if ($759) {
              break;
             }
             _abort();
             // unreachable;
            }
           } while(0);
           $760 = ($751|0)==($749|0);
           if ($760) {
            $761 = 1 << $746;
            $762 = $761 ^ -1;
            $763 = HEAP32[6680>>2]|0;
            $764 = $763 & $762;
            HEAP32[6680>>2] = $764;
            break;
           }
           $765 = ($751|0)==($753|0);
           do {
            if ($765) {
             $$pre58$i$i = (($751) + 8|0);
             $$pre$phi59$i$iZ2D = $$pre58$i$i;
            } else {
             $766 = ($751>>>0)<($756>>>0);
             if ($766) {
              _abort();
              // unreachable;
             }
             $767 = (($751) + 8|0);
             $768 = HEAP32[$767>>2]|0;
             $769 = ($768|0)==($721|0);
             if ($769) {
              $$pre$phi59$i$iZ2D = $767;
              break;
             }
             _abort();
             // unreachable;
            }
           } while(0);
           $770 = (($749) + 12|0);
           HEAP32[$770>>2] = $751;
           HEAP32[$$pre$phi59$i$iZ2D>>2] = $749;
          } else {
           $$sum34$i$i = $720 | 24;
           $$sum105$i = (($$sum34$i$i) + ($tsize$244$i))|0;
           $771 = (($tbase$245$i) + ($$sum105$i)|0);
           $772 = HEAP32[$771>>2]|0;
           $$sum5$i$i = (($tsize$244$i) + 12)|0;
           $$sum106$i = (($$sum5$i$i) + ($720))|0;
           $773 = (($tbase$245$i) + ($$sum106$i)|0);
           $774 = HEAP32[$773>>2]|0;
           $775 = ($774|0)==($721|0);
           do {
            if ($775) {
             $$sum67$i$i = $720 | 16;
             $$sum112$i = (($$sum2$i21$i) + ($$sum67$i$i))|0;
             $785 = (($tbase$245$i) + ($$sum112$i)|0);
             $786 = HEAP32[$785>>2]|0;
             $787 = ($786|0)==(0|0);
             if ($787) {
              $$sum113$i = (($$sum67$i$i) + ($tsize$244$i))|0;
              $788 = (($tbase$245$i) + ($$sum113$i)|0);
              $789 = HEAP32[$788>>2]|0;
              $790 = ($789|0)==(0|0);
              if ($790) {
               $R$1$i$i = 0;
               break;
              } else {
               $R$0$i$i$ph = $789;$RP$0$i$i$ph = $788;
              }
             } else {
              $R$0$i$i$ph = $786;$RP$0$i$i$ph = $785;
             }
             $R$0$i$i = $R$0$i$i$ph;$RP$0$i$i = $RP$0$i$i$ph;
             while(1) {
              $791 = (($R$0$i$i) + 20|0);
              $792 = HEAP32[$791>>2]|0;
              $793 = ($792|0)==(0|0);
              if ($793) {
               $794 = (($R$0$i$i) + 16|0);
               $795 = HEAP32[$794>>2]|0;
               $796 = ($795|0)==(0|0);
               if ($796) {
                $R$0$i$i$lcssa = $R$0$i$i;$RP$0$i$i$lcssa = $RP$0$i$i;
                break;
               } else {
                $R$0$i$i$be = $795;$RP$0$i$i$be = $794;
               }
              } else {
               $R$0$i$i$be = $792;$RP$0$i$i$be = $791;
              }
              $R$0$i$i = $R$0$i$i$be;$RP$0$i$i = $RP$0$i$i$be;
             }
             $797 = ($RP$0$i$i$lcssa>>>0)<($756>>>0);
             if ($797) {
              _abort();
              // unreachable;
             } else {
              HEAP32[$RP$0$i$i$lcssa>>2] = 0;
              $R$1$i$i = $R$0$i$i$lcssa;
              break;
             }
            } else {
             $$sum3536$i$i = $720 | 8;
             $$sum107$i = (($$sum3536$i$i) + ($tsize$244$i))|0;
             $776 = (($tbase$245$i) + ($$sum107$i)|0);
             $777 = HEAP32[$776>>2]|0;
             $778 = ($777>>>0)<($756>>>0);
             if ($778) {
              _abort();
              // unreachable;
             }
             $779 = (($777) + 12|0);
             $780 = HEAP32[$779>>2]|0;
             $781 = ($780|0)==($721|0);
             if (!($781)) {
              _abort();
              // unreachable;
             }
             $782 = (($774) + 8|0);
             $783 = HEAP32[$782>>2]|0;
             $784 = ($783|0)==($721|0);
             if ($784) {
              HEAP32[$779>>2] = $774;
              HEAP32[$782>>2] = $777;
              $R$1$i$i = $774;
              break;
             } else {
              _abort();
              // unreachable;
             }
            }
           } while(0);
           $798 = ($772|0)==(0|0);
           if ($798) {
            break;
           }
           $$sum30$i$i = (($tsize$244$i) + 28)|0;
           $$sum108$i = (($$sum30$i$i) + ($720))|0;
           $799 = (($tbase$245$i) + ($$sum108$i)|0);
           $800 = HEAP32[$799>>2]|0;
           $801 = ((6680 + ($800<<2)|0) + 304|0);
           $802 = HEAP32[$801>>2]|0;
           $803 = ($721|0)==($802|0);
           do {
            if ($803) {
             HEAP32[$801>>2] = $R$1$i$i;
             $cond$i$i = ($R$1$i$i|0)==(0|0);
             if (!($cond$i$i)) {
              break;
             }
             $804 = 1 << $800;
             $805 = $804 ^ -1;
             $806 = HEAP32[((6680 + 4|0))>>2]|0;
             $807 = $806 & $805;
             HEAP32[((6680 + 4|0))>>2] = $807;
             break L360;
            } else {
             $808 = HEAP32[((6680 + 16|0))>>2]|0;
             $809 = ($772>>>0)<($808>>>0);
             if ($809) {
              _abort();
              // unreachable;
             }
             $810 = (($772) + 16|0);
             $811 = HEAP32[$810>>2]|0;
             $812 = ($811|0)==($721|0);
             if ($812) {
              HEAP32[$810>>2] = $R$1$i$i;
             } else {
              $813 = (($772) + 20|0);
              HEAP32[$813>>2] = $R$1$i$i;
             }
             $814 = ($R$1$i$i|0)==(0|0);
             if ($814) {
              break L360;
             }
            }
           } while(0);
           $815 = HEAP32[((6680 + 16|0))>>2]|0;
           $816 = ($R$1$i$i>>>0)<($815>>>0);
           if ($816) {
            _abort();
            // unreachable;
           }
           $817 = (($R$1$i$i) + 24|0);
           HEAP32[$817>>2] = $772;
           $$sum3132$i$i = $720 | 16;
           $$sum109$i = (($$sum3132$i$i) + ($tsize$244$i))|0;
           $818 = (($tbase$245$i) + ($$sum109$i)|0);
           $819 = HEAP32[$818>>2]|0;
           $820 = ($819|0)==(0|0);
           do {
            if (!($820)) {
             $821 = ($819>>>0)<($815>>>0);
             if ($821) {
              _abort();
              // unreachable;
             } else {
              $822 = (($R$1$i$i) + 16|0);
              HEAP32[$822>>2] = $819;
              $823 = (($819) + 24|0);
              HEAP32[$823>>2] = $R$1$i$i;
              break;
             }
            }
           } while(0);
           $$sum110$i = (($$sum2$i21$i) + ($$sum3132$i$i))|0;
           $824 = (($tbase$245$i) + ($$sum110$i)|0);
           $825 = HEAP32[$824>>2]|0;
           $826 = ($825|0)==(0|0);
           if ($826) {
            break;
           }
           $827 = HEAP32[((6680 + 16|0))>>2]|0;
           $828 = ($825>>>0)<($827>>>0);
           if ($828) {
            _abort();
            // unreachable;
           } else {
            $829 = (($R$1$i$i) + 20|0);
            HEAP32[$829>>2] = $825;
            $830 = (($825) + 24|0);
            HEAP32[$830>>2] = $R$1$i$i;
            break;
           }
          }
         } while(0);
         $$sum9$i$i = $745 | $720;
         $$sum111$i = (($$sum9$i$i) + ($tsize$244$i))|0;
         $831 = (($tbase$245$i) + ($$sum111$i)|0);
         $832 = (($745) + ($726))|0;
         $oldfirst$0$i$i = $831;$qsize$0$i$i = $832;
        } else {
         $oldfirst$0$i$i = $721;$qsize$0$i$i = $726;
        }
        $833 = (($oldfirst$0$i$i) + 4|0);
        $834 = HEAP32[$833>>2]|0;
        $835 = $834 & -2;
        HEAP32[$833>>2] = $835;
        $836 = $qsize$0$i$i | 1;
        $$sum10$i$i = (($$sum$i19$i) + 4)|0;
        $837 = (($tbase$245$i) + ($$sum10$i$i)|0);
        HEAP32[$837>>2] = $836;
        $$sum11$i22$i = (($qsize$0$i$i) + ($$sum$i19$i))|0;
        $838 = (($tbase$245$i) + ($$sum11$i22$i)|0);
        HEAP32[$838>>2] = $qsize$0$i$i;
        $839 = $qsize$0$i$i >>> 3;
        $840 = ($qsize$0$i$i>>>0)<(256);
        if ($840) {
         $841 = $839 << 1;
         $842 = ((6680 + ($841<<2)|0) + 40|0);
         $843 = HEAP32[6680>>2]|0;
         $844 = 1 << $839;
         $845 = $843 & $844;
         $846 = ($845|0)==(0);
         do {
          if ($846) {
           $847 = $843 | $844;
           HEAP32[6680>>2] = $847;
           $$sum26$pre$i$i = (($841) + 2)|0;
           $$pre$i23$i = ((6680 + ($$sum26$pre$i$i<<2)|0) + 40|0);
           $$pre$phi$i24$iZ2D = $$pre$i23$i;$F4$0$i$i = $842;
          } else {
           $$sum29$i$i = (($841) + 2)|0;
           $848 = ((6680 + ($$sum29$i$i<<2)|0) + 40|0);
           $849 = HEAP32[$848>>2]|0;
           $850 = HEAP32[((6680 + 16|0))>>2]|0;
           $851 = ($849>>>0)<($850>>>0);
           if (!($851)) {
            $$pre$phi$i24$iZ2D = $848;$F4$0$i$i = $849;
            break;
           }
           _abort();
           // unreachable;
          }
         } while(0);
         HEAP32[$$pre$phi$i24$iZ2D>>2] = $725;
         $852 = (($F4$0$i$i) + 12|0);
         HEAP32[$852>>2] = $725;
         $$sum27$i$i = (($$sum$i19$i) + 8)|0;
         $853 = (($tbase$245$i) + ($$sum27$i$i)|0);
         HEAP32[$853>>2] = $F4$0$i$i;
         $$sum28$i$i = (($$sum$i19$i) + 12)|0;
         $854 = (($tbase$245$i) + ($$sum28$i$i)|0);
         HEAP32[$854>>2] = $842;
         break;
        }
        $855 = $qsize$0$i$i >>> 8;
        $856 = ($855|0)==(0);
        do {
         if ($856) {
          $I7$0$i$i = 0;
         } else {
          $857 = ($qsize$0$i$i>>>0)>(16777215);
          if ($857) {
           $I7$0$i$i = 31;
           break;
          }
          $858 = (($855) + 1048320)|0;
          $859 = $858 >>> 16;
          $860 = $859 & 8;
          $861 = $855 << $860;
          $862 = (($861) + 520192)|0;
          $863 = $862 >>> 16;
          $864 = $863 & 4;
          $865 = $864 | $860;
          $866 = $861 << $864;
          $867 = (($866) + 245760)|0;
          $868 = $867 >>> 16;
          $869 = $868 & 2;
          $870 = $865 | $869;
          $871 = (14 - ($870))|0;
          $872 = $866 << $869;
          $873 = $872 >>> 15;
          $874 = (($871) + ($873))|0;
          $875 = $874 << 1;
          $876 = (($874) + 7)|0;
          $877 = $qsize$0$i$i >>> $876;
          $878 = $877 & 1;
          $879 = $878 | $875;
          $I7$0$i$i = $879;
         }
        } while(0);
        $880 = ((6680 + ($I7$0$i$i<<2)|0) + 304|0);
        $$sum12$i$i = (($$sum$i19$i) + 28)|0;
        $881 = (($tbase$245$i) + ($$sum12$i$i)|0);
        HEAP32[$881>>2] = $I7$0$i$i;
        $$sum13$i$i = (($$sum$i19$i) + 16)|0;
        $882 = (($tbase$245$i) + ($$sum13$i$i)|0);
        $$sum14$i$i = (($$sum$i19$i) + 20)|0;
        $883 = (($tbase$245$i) + ($$sum14$i$i)|0);
        HEAP32[$883>>2] = 0;
        HEAP32[$882>>2] = 0;
        $884 = HEAP32[((6680 + 4|0))>>2]|0;
        $885 = 1 << $I7$0$i$i;
        $886 = $884 & $885;
        $887 = ($886|0)==(0);
        if ($887) {
         $888 = $884 | $885;
         HEAP32[((6680 + 4|0))>>2] = $888;
         HEAP32[$880>>2] = $725;
         $$sum15$i$i = (($$sum$i19$i) + 24)|0;
         $889 = (($tbase$245$i) + ($$sum15$i$i)|0);
         HEAP32[$889>>2] = $880;
         $$sum16$i$i = (($$sum$i19$i) + 12)|0;
         $890 = (($tbase$245$i) + ($$sum16$i$i)|0);
         HEAP32[$890>>2] = $725;
         $$sum17$i$i = (($$sum$i19$i) + 8)|0;
         $891 = (($tbase$245$i) + ($$sum17$i$i)|0);
         HEAP32[$891>>2] = $725;
         break;
        }
        $892 = HEAP32[$880>>2]|0;
        $893 = ($I7$0$i$i|0)==(31);
        if ($893) {
         $901 = 0;
        } else {
         $894 = $I7$0$i$i >>> 1;
         $895 = (25 - ($894))|0;
         $901 = $895;
        }
        $896 = (($892) + 4|0);
        $897 = HEAP32[$896>>2]|0;
        $898 = $897 & -8;
        $899 = ($898|0)==($qsize$0$i$i|0);
        do {
         if ($899) {
          $T$0$lcssa$i26$i = $892;
         } else {
          $900 = $qsize$0$i$i << $901;
          $K8$053$i$i = $900;$T$052$i$i = $892;
          while(1) {
           $908 = $K8$053$i$i >>> 31;
           $909 = ((($T$052$i$i) + ($908<<2)|0) + 16|0);
           $904 = HEAP32[$909>>2]|0;
           $910 = ($904|0)==(0|0);
           if ($910) {
            $$lcssa = $909;$T$052$i$i$lcssa = $T$052$i$i;
            break;
           }
           $902 = $K8$053$i$i << 1;
           $903 = (($904) + 4|0);
           $905 = HEAP32[$903>>2]|0;
           $906 = $905 & -8;
           $907 = ($906|0)==($qsize$0$i$i|0);
           if ($907) {
            $$lcssa110 = $904;
            label = 314;
            break;
           } else {
            $K8$053$i$i = $902;$T$052$i$i = $904;
           }
          }
          if ((label|0) == 314) {
           $T$0$lcssa$i26$i = $$lcssa110;
           break;
          }
          $911 = HEAP32[((6680 + 16|0))>>2]|0;
          $912 = ($$lcssa>>>0)<($911>>>0);
          if ($912) {
           _abort();
           // unreachable;
          } else {
           HEAP32[$$lcssa>>2] = $725;
           $$sum23$i$i = (($$sum$i19$i) + 24)|0;
           $913 = (($tbase$245$i) + ($$sum23$i$i)|0);
           HEAP32[$913>>2] = $T$052$i$i$lcssa;
           $$sum24$i$i = (($$sum$i19$i) + 12)|0;
           $914 = (($tbase$245$i) + ($$sum24$i$i)|0);
           HEAP32[$914>>2] = $725;
           $$sum25$i$i = (($$sum$i19$i) + 8)|0;
           $915 = (($tbase$245$i) + ($$sum25$i$i)|0);
           HEAP32[$915>>2] = $725;
           break L352;
          }
         }
        } while(0);
        $916 = (($T$0$lcssa$i26$i) + 8|0);
        $917 = HEAP32[$916>>2]|0;
        $918 = HEAP32[((6680 + 16|0))>>2]|0;
        $919 = ($T$0$lcssa$i26$i>>>0)>=($918>>>0);
        $920 = ($917>>>0)>=($918>>>0);
        $or$cond$i27$i = $919 & $920;
        if ($or$cond$i27$i) {
         $921 = (($917) + 12|0);
         HEAP32[$921>>2] = $725;
         HEAP32[$916>>2] = $725;
         $$sum20$i$i = (($$sum$i19$i) + 8)|0;
         $922 = (($tbase$245$i) + ($$sum20$i$i)|0);
         HEAP32[$922>>2] = $917;
         $$sum21$i$i = (($$sum$i19$i) + 12)|0;
         $923 = (($tbase$245$i) + ($$sum21$i$i)|0);
         HEAP32[$923>>2] = $T$0$lcssa$i26$i;
         $$sum22$i$i = (($$sum$i19$i) + 24)|0;
         $924 = (($tbase$245$i) + ($$sum22$i$i)|0);
         HEAP32[$924>>2] = 0;
         break;
        } else {
         _abort();
         // unreachable;
        }
       }
      } while(0);
      $$sum1819$i$i = $713 | 8;
      $925 = (($tbase$245$i) + ($$sum1819$i$i)|0);
      $mem$0 = $925;
      return ($mem$0|0);
     }
    }
    else if ((label|0) == 319) {
    }
    $sp$0$i$i$i = ((6680 + 448|0));
    while(1) {
     $926 = HEAP32[$sp$0$i$i$i>>2]|0;
     $927 = ($926>>>0)>($636>>>0);
     if (!($927)) {
      $928 = (($sp$0$i$i$i) + 4|0);
      $929 = HEAP32[$928>>2]|0;
      $930 = (($926) + ($929)|0);
      $931 = ($930>>>0)>($636>>>0);
      if ($931) {
       $$lcssa116 = $926;$$lcssa117 = $929;$$lcssa118 = $930;
       break;
      }
     }
     $932 = (($sp$0$i$i$i) + 8|0);
     $933 = HEAP32[$932>>2]|0;
     $sp$0$i$i$i = $933;
    }
    $$sum$i13$i = (($$lcssa117) + -47)|0;
    $$sum1$i14$i = (($$lcssa117) + -39)|0;
    $934 = (($$lcssa116) + ($$sum1$i14$i)|0);
    $935 = $934;
    $936 = $935 & 7;
    $937 = ($936|0)==(0);
    if ($937) {
     $940 = 0;
    } else {
     $938 = (0 - ($935))|0;
     $939 = $938 & 7;
     $940 = $939;
    }
    $$sum2$i15$i = (($$sum$i13$i) + ($940))|0;
    $941 = (($$lcssa116) + ($$sum2$i15$i)|0);
    $942 = (($636) + 16|0);
    $943 = ($941>>>0)<($942>>>0);
    $944 = $943 ? $636 : $941;
    $945 = (($944) + 8|0);
    $946 = (($tsize$244$i) + -40)|0;
    $947 = (($tbase$245$i) + 8|0);
    $948 = $947;
    $949 = $948 & 7;
    $950 = ($949|0)==(0);
    if ($950) {
     $954 = 0;
    } else {
     $951 = (0 - ($948))|0;
     $952 = $951 & 7;
     $954 = $952;
    }
    $953 = (($tbase$245$i) + ($954)|0);
    $955 = (($946) - ($954))|0;
    HEAP32[((6680 + 24|0))>>2] = $953;
    HEAP32[((6680 + 12|0))>>2] = $955;
    $956 = $955 | 1;
    $$sum$i$i$i = (($954) + 4)|0;
    $957 = (($tbase$245$i) + ($$sum$i$i$i)|0);
    HEAP32[$957>>2] = $956;
    $$sum2$i$i$i = (($tsize$244$i) + -36)|0;
    $958 = (($tbase$245$i) + ($$sum2$i$i$i)|0);
    HEAP32[$958>>2] = 40;
    $959 = HEAP32[((7152 + 16|0))>>2]|0;
    HEAP32[((6680 + 28|0))>>2] = $959;
    $960 = (($944) + 4|0);
    HEAP32[$960>>2] = 27;
    ;HEAP32[$945+0>>2]=HEAP32[((6680 + 448|0))+0>>2]|0;HEAP32[$945+4>>2]=HEAP32[((6680 + 448|0))+4>>2]|0;HEAP32[$945+8>>2]=HEAP32[((6680 + 448|0))+8>>2]|0;HEAP32[$945+12>>2]=HEAP32[((6680 + 448|0))+12>>2]|0;
    HEAP32[((6680 + 448|0))>>2] = $tbase$245$i;
    HEAP32[((6680 + 452|0))>>2] = $tsize$244$i;
    HEAP32[((6680 + 460|0))>>2] = 0;
    HEAP32[((6680 + 456|0))>>2] = $945;
    $961 = (($944) + 28|0);
    HEAP32[$961>>2] = 7;
    $962 = (($944) + 32|0);
    $963 = ($962>>>0)<($$lcssa118>>>0);
    if ($963) {
     $965 = $961;
     while(1) {
      $964 = (($965) + 4|0);
      HEAP32[$964>>2] = 7;
      $966 = (($965) + 8|0);
      $967 = ($966>>>0)<($$lcssa118>>>0);
      if ($967) {
       $965 = $964;
      } else {
       break;
      }
     }
    }
    $968 = ($944|0)==($636|0);
    if (!($968)) {
     $969 = $944;
     $970 = $636;
     $971 = (($969) - ($970))|0;
     $972 = (($636) + ($971)|0);
     $$sum3$i$i = (($971) + 4)|0;
     $973 = (($636) + ($$sum3$i$i)|0);
     $974 = HEAP32[$973>>2]|0;
     $975 = $974 & -2;
     HEAP32[$973>>2] = $975;
     $976 = $971 | 1;
     $977 = (($636) + 4|0);
     HEAP32[$977>>2] = $976;
     HEAP32[$972>>2] = $971;
     $978 = $971 >>> 3;
     $979 = ($971>>>0)<(256);
     if ($979) {
      $980 = $978 << 1;
      $981 = ((6680 + ($980<<2)|0) + 40|0);
      $982 = HEAP32[6680>>2]|0;
      $983 = 1 << $978;
      $984 = $982 & $983;
      $985 = ($984|0)==(0);
      do {
       if ($985) {
        $986 = $982 | $983;
        HEAP32[6680>>2] = $986;
        $$sum10$pre$i$i = (($980) + 2)|0;
        $$pre$i$i = ((6680 + ($$sum10$pre$i$i<<2)|0) + 40|0);
        $$pre$phi$i$iZ2D = $$pre$i$i;$F$0$i$i = $981;
       } else {
        $$sum11$i$i = (($980) + 2)|0;
        $987 = ((6680 + ($$sum11$i$i<<2)|0) + 40|0);
        $988 = HEAP32[$987>>2]|0;
        $989 = HEAP32[((6680 + 16|0))>>2]|0;
        $990 = ($988>>>0)<($989>>>0);
        if (!($990)) {
         $$pre$phi$i$iZ2D = $987;$F$0$i$i = $988;
         break;
        }
        _abort();
        // unreachable;
       }
      } while(0);
      HEAP32[$$pre$phi$i$iZ2D>>2] = $636;
      $991 = (($F$0$i$i) + 12|0);
      HEAP32[$991>>2] = $636;
      $992 = (($636) + 8|0);
      HEAP32[$992>>2] = $F$0$i$i;
      $993 = (($636) + 12|0);
      HEAP32[$993>>2] = $981;
      break;
     }
     $994 = $971 >>> 8;
     $995 = ($994|0)==(0);
     if ($995) {
      $I1$0$i$i = 0;
     } else {
      $996 = ($971>>>0)>(16777215);
      if ($996) {
       $I1$0$i$i = 31;
      } else {
       $997 = (($994) + 1048320)|0;
       $998 = $997 >>> 16;
       $999 = $998 & 8;
       $1000 = $994 << $999;
       $1001 = (($1000) + 520192)|0;
       $1002 = $1001 >>> 16;
       $1003 = $1002 & 4;
       $1004 = $1003 | $999;
       $1005 = $1000 << $1003;
       $1006 = (($1005) + 245760)|0;
       $1007 = $1006 >>> 16;
       $1008 = $1007 & 2;
       $1009 = $1004 | $1008;
       $1010 = (14 - ($1009))|0;
       $1011 = $1005 << $1008;
       $1012 = $1011 >>> 15;
       $1013 = (($1010) + ($1012))|0;
       $1014 = $1013 << 1;
       $1015 = (($1013) + 7)|0;
       $1016 = $971 >>> $1015;
       $1017 = $1016 & 1;
       $1018 = $1017 | $1014;
       $I1$0$i$i = $1018;
      }
     }
     $1019 = ((6680 + ($I1$0$i$i<<2)|0) + 304|0);
     $1020 = (($636) + 28|0);
     $I1$0$c$i$i = $I1$0$i$i;
     HEAP32[$1020>>2] = $I1$0$c$i$i;
     $1021 = (($636) + 20|0);
     HEAP32[$1021>>2] = 0;
     $1022 = (($636) + 16|0);
     HEAP32[$1022>>2] = 0;
     $1023 = HEAP32[((6680 + 4|0))>>2]|0;
     $1024 = 1 << $I1$0$i$i;
     $1025 = $1023 & $1024;
     $1026 = ($1025|0)==(0);
     if ($1026) {
      $1027 = $1023 | $1024;
      HEAP32[((6680 + 4|0))>>2] = $1027;
      HEAP32[$1019>>2] = $636;
      $1028 = (($636) + 24|0);
      HEAP32[$1028>>2] = $1019;
      $1029 = (($636) + 12|0);
      HEAP32[$1029>>2] = $636;
      $1030 = (($636) + 8|0);
      HEAP32[$1030>>2] = $636;
      break;
     }
     $1031 = HEAP32[$1019>>2]|0;
     $1032 = ($I1$0$i$i|0)==(31);
     if ($1032) {
      $1040 = 0;
     } else {
      $1033 = $I1$0$i$i >>> 1;
      $1034 = (25 - ($1033))|0;
      $1040 = $1034;
     }
     $1035 = (($1031) + 4|0);
     $1036 = HEAP32[$1035>>2]|0;
     $1037 = $1036 & -8;
     $1038 = ($1037|0)==($971|0);
     do {
      if ($1038) {
       $T$0$lcssa$i$i = $1031;
      } else {
       $1039 = $971 << $1040;
       $K2$015$i$i = $1039;$T$014$i$i = $1031;
       while(1) {
        $1047 = $K2$015$i$i >>> 31;
        $1048 = ((($T$014$i$i) + ($1047<<2)|0) + 16|0);
        $1043 = HEAP32[$1048>>2]|0;
        $1049 = ($1043|0)==(0|0);
        if ($1049) {
         $$lcssa112 = $1048;$T$014$i$i$lcssa = $T$014$i$i;
         break;
        }
        $1041 = $K2$015$i$i << 1;
        $1042 = (($1043) + 4|0);
        $1044 = HEAP32[$1042>>2]|0;
        $1045 = $1044 & -8;
        $1046 = ($1045|0)==($971|0);
        if ($1046) {
         $$lcssa115 = $1043;
         label = 353;
         break;
        } else {
         $K2$015$i$i = $1041;$T$014$i$i = $1043;
        }
       }
       if ((label|0) == 353) {
        $T$0$lcssa$i$i = $$lcssa115;
        break;
       }
       $1050 = HEAP32[((6680 + 16|0))>>2]|0;
       $1051 = ($$lcssa112>>>0)<($1050>>>0);
       if ($1051) {
        _abort();
        // unreachable;
       } else {
        HEAP32[$$lcssa112>>2] = $636;
        $1052 = (($636) + 24|0);
        HEAP32[$1052>>2] = $T$014$i$i$lcssa;
        $1053 = (($636) + 12|0);
        HEAP32[$1053>>2] = $636;
        $1054 = (($636) + 8|0);
        HEAP32[$1054>>2] = $636;
        break L323;
       }
      }
     } while(0);
     $1055 = (($T$0$lcssa$i$i) + 8|0);
     $1056 = HEAP32[$1055>>2]|0;
     $1057 = HEAP32[((6680 + 16|0))>>2]|0;
     $1058 = ($T$0$lcssa$i$i>>>0)>=($1057>>>0);
     $1059 = ($1056>>>0)>=($1057>>>0);
     $or$cond$i$i = $1058 & $1059;
     if ($or$cond$i$i) {
      $1060 = (($1056) + 12|0);
      HEAP32[$1060>>2] = $636;
      HEAP32[$1055>>2] = $636;
      $1061 = (($636) + 8|0);
      HEAP32[$1061>>2] = $1056;
      $1062 = (($636) + 12|0);
      HEAP32[$1062>>2] = $T$0$lcssa$i$i;
      $1063 = (($636) + 24|0);
      HEAP32[$1063>>2] = 0;
      break;
     } else {
      _abort();
      // unreachable;
     }
    }
   }
  } while(0);
  $1064 = HEAP32[((6680 + 12|0))>>2]|0;
  $1065 = ($1064>>>0)>($nb$0>>>0);
  if ($1065) {
   $1066 = (($1064) - ($nb$0))|0;
   HEAP32[((6680 + 12|0))>>2] = $1066;
   $1067 = HEAP32[((6680 + 24|0))>>2]|0;
   $1068 = (($1067) + ($nb$0)|0);
   HEAP32[((6680 + 24|0))>>2] = $1068;
   $1069 = $1066 | 1;
   $$sum$i32 = (($nb$0) + 4)|0;
   $1070 = (($1067) + ($$sum$i32)|0);
   HEAP32[$1070>>2] = $1069;
   $1071 = $nb$0 | 3;
   $1072 = (($1067) + 4|0);
   HEAP32[$1072>>2] = $1071;
   $1073 = (($1067) + 8|0);
   $mem$0 = $1073;
   return ($mem$0|0);
  }
 }
 $1074 = (___errno_location()|0);
 HEAP32[$1074>>2] = 12;
 $mem$0 = 0;
 return ($mem$0|0);
}
function _free($mem) {
 $mem = $mem|0;
 var $$lcssa = 0, $$lcssa73 = 0, $$pre = 0, $$pre$phi66Z2D = 0, $$pre$phi68Z2D = 0, $$pre$phiZ2D = 0, $$pre65 = 0, $$pre67 = 0, $$sum = 0, $$sum16$pre = 0, $$sum17 = 0, $$sum18 = 0, $$sum19 = 0, $$sum2 = 0, $$sum20 = 0, $$sum2324 = 0, $$sum25 = 0, $$sum26 = 0, $$sum28 = 0, $$sum29 = 0;
 var $$sum3 = 0, $$sum30 = 0, $$sum31 = 0, $$sum32 = 0, $$sum33 = 0, $$sum34 = 0, $$sum35 = 0, $$sum36 = 0, $$sum37 = 0, $$sum5 = 0, $$sum67 = 0, $$sum8 = 0, $$sum9 = 0, $0 = 0, $1 = 0, $10 = 0, $100 = 0, $101 = 0, $102 = 0, $103 = 0;
 var $104 = 0, $105 = 0, $106 = 0, $107 = 0, $108 = 0, $109 = 0, $11 = 0, $110 = 0, $111 = 0, $112 = 0, $113 = 0, $114 = 0, $115 = 0, $116 = 0, $117 = 0, $118 = 0, $119 = 0, $12 = 0, $120 = 0, $121 = 0;
 var $122 = 0, $123 = 0, $124 = 0, $125 = 0, $126 = 0, $127 = 0, $128 = 0, $129 = 0, $13 = 0, $130 = 0, $131 = 0, $132 = 0, $133 = 0, $134 = 0, $135 = 0, $136 = 0, $137 = 0, $138 = 0, $139 = 0, $14 = 0;
 var $140 = 0, $141 = 0, $142 = 0, $143 = 0, $144 = 0, $145 = 0, $146 = 0, $147 = 0, $148 = 0, $149 = 0, $15 = 0, $150 = 0, $151 = 0, $152 = 0, $153 = 0, $154 = 0, $155 = 0, $156 = 0, $157 = 0, $158 = 0;
 var $159 = 0, $16 = 0, $160 = 0, $161 = 0, $162 = 0, $163 = 0, $164 = 0, $165 = 0, $166 = 0, $167 = 0, $168 = 0, $169 = 0, $17 = 0, $170 = 0, $171 = 0, $172 = 0, $173 = 0, $174 = 0, $175 = 0, $176 = 0;
 var $177 = 0, $178 = 0, $179 = 0, $18 = 0, $180 = 0, $181 = 0, $182 = 0, $183 = 0, $184 = 0, $185 = 0, $186 = 0, $187 = 0, $188 = 0, $189 = 0, $19 = 0, $190 = 0, $191 = 0, $192 = 0, $193 = 0, $194 = 0;
 var $195 = 0, $196 = 0, $197 = 0, $198 = 0, $199 = 0, $2 = 0, $20 = 0, $200 = 0, $201 = 0, $202 = 0, $203 = 0, $204 = 0, $205 = 0, $206 = 0, $207 = 0, $208 = 0, $209 = 0, $21 = 0, $210 = 0, $211 = 0;
 var $212 = 0, $213 = 0, $214 = 0, $215 = 0, $216 = 0, $217 = 0, $218 = 0, $219 = 0, $22 = 0, $220 = 0, $221 = 0, $222 = 0, $223 = 0, $224 = 0, $225 = 0, $226 = 0, $227 = 0, $228 = 0, $229 = 0, $23 = 0;
 var $230 = 0, $231 = 0, $232 = 0, $233 = 0, $234 = 0, $235 = 0, $236 = 0, $237 = 0, $238 = 0, $239 = 0, $24 = 0, $240 = 0, $241 = 0, $242 = 0, $243 = 0, $244 = 0, $245 = 0, $246 = 0, $247 = 0, $248 = 0;
 var $249 = 0, $25 = 0, $250 = 0, $251 = 0, $252 = 0, $253 = 0, $254 = 0, $255 = 0, $256 = 0, $257 = 0, $258 = 0, $259 = 0, $26 = 0, $260 = 0, $261 = 0, $262 = 0, $263 = 0, $264 = 0, $265 = 0, $266 = 0;
 var $267 = 0, $268 = 0, $269 = 0, $27 = 0, $270 = 0, $271 = 0, $272 = 0, $273 = 0, $274 = 0, $275 = 0, $276 = 0, $277 = 0, $278 = 0, $279 = 0, $28 = 0, $280 = 0, $281 = 0, $282 = 0, $283 = 0, $284 = 0;
 var $285 = 0, $286 = 0, $287 = 0, $288 = 0, $289 = 0, $29 = 0, $290 = 0, $291 = 0, $292 = 0, $293 = 0, $294 = 0, $295 = 0, $296 = 0, $297 = 0, $298 = 0, $299 = 0, $3 = 0, $30 = 0, $300 = 0, $301 = 0;
 var $302 = 0, $303 = 0, $304 = 0, $305 = 0, $306 = 0, $307 = 0, $308 = 0, $309 = 0, $31 = 0, $310 = 0, $311 = 0, $312 = 0, $313 = 0, $314 = 0, $315 = 0, $316 = 0, $317 = 0, $318 = 0, $319 = 0, $32 = 0;
 var $320 = 0, $321 = 0, $33 = 0, $34 = 0, $35 = 0, $36 = 0, $37 = 0, $38 = 0, $39 = 0, $4 = 0, $40 = 0, $41 = 0, $42 = 0, $43 = 0, $44 = 0, $45 = 0, $46 = 0, $47 = 0, $48 = 0, $49 = 0;
 var $5 = 0, $50 = 0, $51 = 0, $52 = 0, $53 = 0, $54 = 0, $55 = 0, $56 = 0, $57 = 0, $58 = 0, $59 = 0, $6 = 0, $60 = 0, $61 = 0, $62 = 0, $63 = 0, $64 = 0, $65 = 0, $66 = 0, $67 = 0;
 var $68 = 0, $69 = 0, $7 = 0, $70 = 0, $71 = 0, $72 = 0, $73 = 0, $74 = 0, $75 = 0, $76 = 0, $77 = 0, $78 = 0, $79 = 0, $8 = 0, $80 = 0, $81 = 0, $82 = 0, $83 = 0, $84 = 0, $85 = 0;
 var $86 = 0, $87 = 0, $88 = 0, $89 = 0, $9 = 0, $90 = 0, $91 = 0, $92 = 0, $93 = 0, $94 = 0, $95 = 0, $96 = 0, $97 = 0, $98 = 0, $99 = 0, $F16$0 = 0, $I18$0 = 0, $I18$0$c = 0, $K19$060 = 0, $R$0 = 0;
 var $R$0$be = 0, $R$0$lcssa = 0, $R$0$ph = 0, $R$1 = 0, $R7$0 = 0, $R7$0$be = 0, $R7$0$lcssa = 0, $R7$0$ph = 0, $R7$1 = 0, $RP$0 = 0, $RP$0$be = 0, $RP$0$lcssa = 0, $RP$0$ph = 0, $RP9$0 = 0, $RP9$0$be = 0, $RP9$0$lcssa = 0, $RP9$0$ph = 0, $T$0$lcssa = 0, $T$059 = 0, $T$059$lcssa = 0;
 var $cond = 0, $cond54 = 0, $or$cond = 0, $p$0 = 0, $psize$0 = 0, $psize$1 = 0, $sp$0$i = 0, $sp$0$in$i = 0, label = 0, sp = 0;
 sp = STACKTOP;
 $0 = ($mem|0)==(0|0);
 if ($0) {
  return;
 }
 $1 = (($mem) + -8|0);
 $2 = HEAP32[((6680 + 16|0))>>2]|0;
 $3 = ($1>>>0)<($2>>>0);
 if ($3) {
  _abort();
  // unreachable;
 }
 $4 = (($mem) + -4|0);
 $5 = HEAP32[$4>>2]|0;
 $6 = $5 & 3;
 $7 = ($6|0)==(1);
 if ($7) {
  _abort();
  // unreachable;
 }
 $8 = $5 & -8;
 $$sum = (($8) + -8)|0;
 $9 = (($mem) + ($$sum)|0);
 $10 = $5 & 1;
 $11 = ($10|0)==(0);
 do {
  if ($11) {
   $12 = HEAP32[$1>>2]|0;
   $13 = ($6|0)==(0);
   if ($13) {
    return;
   }
   $$sum2 = (-8 - ($12))|0;
   $14 = (($mem) + ($$sum2)|0);
   $15 = (($12) + ($8))|0;
   $16 = ($14>>>0)<($2>>>0);
   if ($16) {
    _abort();
    // unreachable;
   }
   $17 = HEAP32[((6680 + 20|0))>>2]|0;
   $18 = ($14|0)==($17|0);
   if ($18) {
    $$sum3 = (($8) + -4)|0;
    $103 = (($mem) + ($$sum3)|0);
    $104 = HEAP32[$103>>2]|0;
    $105 = $104 & 3;
    $106 = ($105|0)==(3);
    if (!($106)) {
     $p$0 = $14;$psize$0 = $15;
     break;
    }
    HEAP32[((6680 + 8|0))>>2] = $15;
    $107 = $104 & -2;
    HEAP32[$103>>2] = $107;
    $108 = $15 | 1;
    $$sum26 = (($$sum2) + 4)|0;
    $109 = (($mem) + ($$sum26)|0);
    HEAP32[$109>>2] = $108;
    HEAP32[$9>>2] = $15;
    return;
   }
   $19 = $12 >>> 3;
   $20 = ($12>>>0)<(256);
   if ($20) {
    $$sum36 = (($$sum2) + 8)|0;
    $21 = (($mem) + ($$sum36)|0);
    $22 = HEAP32[$21>>2]|0;
    $$sum37 = (($$sum2) + 12)|0;
    $23 = (($mem) + ($$sum37)|0);
    $24 = HEAP32[$23>>2]|0;
    $25 = $19 << 1;
    $26 = ((6680 + ($25<<2)|0) + 40|0);
    $27 = ($22|0)==($26|0);
    if (!($27)) {
     $28 = ($22>>>0)<($2>>>0);
     if ($28) {
      _abort();
      // unreachable;
     }
     $29 = (($22) + 12|0);
     $30 = HEAP32[$29>>2]|0;
     $31 = ($30|0)==($14|0);
     if (!($31)) {
      _abort();
      // unreachable;
     }
    }
    $32 = ($24|0)==($22|0);
    if ($32) {
     $33 = 1 << $19;
     $34 = $33 ^ -1;
     $35 = HEAP32[6680>>2]|0;
     $36 = $35 & $34;
     HEAP32[6680>>2] = $36;
     $p$0 = $14;$psize$0 = $15;
     break;
    }
    $37 = ($24|0)==($26|0);
    if ($37) {
     $$pre67 = (($24) + 8|0);
     $$pre$phi68Z2D = $$pre67;
    } else {
     $38 = ($24>>>0)<($2>>>0);
     if ($38) {
      _abort();
      // unreachable;
     }
     $39 = (($24) + 8|0);
     $40 = HEAP32[$39>>2]|0;
     $41 = ($40|0)==($14|0);
     if ($41) {
      $$pre$phi68Z2D = $39;
     } else {
      _abort();
      // unreachable;
     }
    }
    $42 = (($22) + 12|0);
    HEAP32[$42>>2] = $24;
    HEAP32[$$pre$phi68Z2D>>2] = $22;
    $p$0 = $14;$psize$0 = $15;
    break;
   }
   $$sum28 = (($$sum2) + 24)|0;
   $43 = (($mem) + ($$sum28)|0);
   $44 = HEAP32[$43>>2]|0;
   $$sum29 = (($$sum2) + 12)|0;
   $45 = (($mem) + ($$sum29)|0);
   $46 = HEAP32[$45>>2]|0;
   $47 = ($46|0)==($14|0);
   do {
    if ($47) {
     $$sum31 = (($$sum2) + 20)|0;
     $57 = (($mem) + ($$sum31)|0);
     $58 = HEAP32[$57>>2]|0;
     $59 = ($58|0)==(0|0);
     if ($59) {
      $$sum30 = (($$sum2) + 16)|0;
      $60 = (($mem) + ($$sum30)|0);
      $61 = HEAP32[$60>>2]|0;
      $62 = ($61|0)==(0|0);
      if ($62) {
       $R$1 = 0;
       break;
      } else {
       $R$0$ph = $61;$RP$0$ph = $60;
      }
     } else {
      $R$0$ph = $58;$RP$0$ph = $57;
     }
     $R$0 = $R$0$ph;$RP$0 = $RP$0$ph;
     while(1) {
      $63 = (($R$0) + 20|0);
      $64 = HEAP32[$63>>2]|0;
      $65 = ($64|0)==(0|0);
      if ($65) {
       $66 = (($R$0) + 16|0);
       $67 = HEAP32[$66>>2]|0;
       $68 = ($67|0)==(0|0);
       if ($68) {
        $R$0$lcssa = $R$0;$RP$0$lcssa = $RP$0;
        break;
       } else {
        $R$0$be = $67;$RP$0$be = $66;
       }
      } else {
       $R$0$be = $64;$RP$0$be = $63;
      }
      $R$0 = $R$0$be;$RP$0 = $RP$0$be;
     }
     $69 = ($RP$0$lcssa>>>0)<($2>>>0);
     if ($69) {
      _abort();
      // unreachable;
     } else {
      HEAP32[$RP$0$lcssa>>2] = 0;
      $R$1 = $R$0$lcssa;
      break;
     }
    } else {
     $$sum35 = (($$sum2) + 8)|0;
     $48 = (($mem) + ($$sum35)|0);
     $49 = HEAP32[$48>>2]|0;
     $50 = ($49>>>0)<($2>>>0);
     if ($50) {
      _abort();
      // unreachable;
     }
     $51 = (($49) + 12|0);
     $52 = HEAP32[$51>>2]|0;
     $53 = ($52|0)==($14|0);
     if (!($53)) {
      _abort();
      // unreachable;
     }
     $54 = (($46) + 8|0);
     $55 = HEAP32[$54>>2]|0;
     $56 = ($55|0)==($14|0);
     if ($56) {
      HEAP32[$51>>2] = $46;
      HEAP32[$54>>2] = $49;
      $R$1 = $46;
      break;
     } else {
      _abort();
      // unreachable;
     }
    }
   } while(0);
   $70 = ($44|0)==(0|0);
   if ($70) {
    $p$0 = $14;$psize$0 = $15;
   } else {
    $$sum32 = (($$sum2) + 28)|0;
    $71 = (($mem) + ($$sum32)|0);
    $72 = HEAP32[$71>>2]|0;
    $73 = ((6680 + ($72<<2)|0) + 304|0);
    $74 = HEAP32[$73>>2]|0;
    $75 = ($14|0)==($74|0);
    if ($75) {
     HEAP32[$73>>2] = $R$1;
     $cond = ($R$1|0)==(0|0);
     if ($cond) {
      $76 = 1 << $72;
      $77 = $76 ^ -1;
      $78 = HEAP32[((6680 + 4|0))>>2]|0;
      $79 = $78 & $77;
      HEAP32[((6680 + 4|0))>>2] = $79;
      $p$0 = $14;$psize$0 = $15;
      break;
     }
    } else {
     $80 = HEAP32[((6680 + 16|0))>>2]|0;
     $81 = ($44>>>0)<($80>>>0);
     if ($81) {
      _abort();
      // unreachable;
     }
     $82 = (($44) + 16|0);
     $83 = HEAP32[$82>>2]|0;
     $84 = ($83|0)==($14|0);
     if ($84) {
      HEAP32[$82>>2] = $R$1;
     } else {
      $85 = (($44) + 20|0);
      HEAP32[$85>>2] = $R$1;
     }
     $86 = ($R$1|0)==(0|0);
     if ($86) {
      $p$0 = $14;$psize$0 = $15;
      break;
     }
    }
    $87 = HEAP32[((6680 + 16|0))>>2]|0;
    $88 = ($R$1>>>0)<($87>>>0);
    if ($88) {
     _abort();
     // unreachable;
    }
    $89 = (($R$1) + 24|0);
    HEAP32[$89>>2] = $44;
    $$sum33 = (($$sum2) + 16)|0;
    $90 = (($mem) + ($$sum33)|0);
    $91 = HEAP32[$90>>2]|0;
    $92 = ($91|0)==(0|0);
    do {
     if (!($92)) {
      $93 = ($91>>>0)<($87>>>0);
      if ($93) {
       _abort();
       // unreachable;
      } else {
       $94 = (($R$1) + 16|0);
       HEAP32[$94>>2] = $91;
       $95 = (($91) + 24|0);
       HEAP32[$95>>2] = $R$1;
       break;
      }
     }
    } while(0);
    $$sum34 = (($$sum2) + 20)|0;
    $96 = (($mem) + ($$sum34)|0);
    $97 = HEAP32[$96>>2]|0;
    $98 = ($97|0)==(0|0);
    if ($98) {
     $p$0 = $14;$psize$0 = $15;
    } else {
     $99 = HEAP32[((6680 + 16|0))>>2]|0;
     $100 = ($97>>>0)<($99>>>0);
     if ($100) {
      _abort();
      // unreachable;
     } else {
      $101 = (($R$1) + 20|0);
      HEAP32[$101>>2] = $97;
      $102 = (($97) + 24|0);
      HEAP32[$102>>2] = $R$1;
      $p$0 = $14;$psize$0 = $15;
      break;
     }
    }
   }
  } else {
   $p$0 = $1;$psize$0 = $8;
  }
 } while(0);
 $110 = ($p$0>>>0)<($9>>>0);
 if (!($110)) {
  _abort();
  // unreachable;
 }
 $$sum25 = (($8) + -4)|0;
 $111 = (($mem) + ($$sum25)|0);
 $112 = HEAP32[$111>>2]|0;
 $113 = $112 & 1;
 $114 = ($113|0)==(0);
 if ($114) {
  _abort();
  // unreachable;
 }
 $115 = $112 & 2;
 $116 = ($115|0)==(0);
 if ($116) {
  $117 = HEAP32[((6680 + 24|0))>>2]|0;
  $118 = ($9|0)==($117|0);
  if ($118) {
   $119 = HEAP32[((6680 + 12|0))>>2]|0;
   $120 = (($119) + ($psize$0))|0;
   HEAP32[((6680 + 12|0))>>2] = $120;
   HEAP32[((6680 + 24|0))>>2] = $p$0;
   $121 = $120 | 1;
   $122 = (($p$0) + 4|0);
   HEAP32[$122>>2] = $121;
   $123 = HEAP32[((6680 + 20|0))>>2]|0;
   $124 = ($p$0|0)==($123|0);
   if (!($124)) {
    return;
   }
   HEAP32[((6680 + 20|0))>>2] = 0;
   HEAP32[((6680 + 8|0))>>2] = 0;
   return;
  }
  $125 = HEAP32[((6680 + 20|0))>>2]|0;
  $126 = ($9|0)==($125|0);
  if ($126) {
   $127 = HEAP32[((6680 + 8|0))>>2]|0;
   $128 = (($127) + ($psize$0))|0;
   HEAP32[((6680 + 8|0))>>2] = $128;
   HEAP32[((6680 + 20|0))>>2] = $p$0;
   $129 = $128 | 1;
   $130 = (($p$0) + 4|0);
   HEAP32[$130>>2] = $129;
   $131 = (($p$0) + ($128)|0);
   HEAP32[$131>>2] = $128;
   return;
  }
  $132 = $112 & -8;
  $133 = (($132) + ($psize$0))|0;
  $134 = $112 >>> 3;
  $135 = ($112>>>0)<(256);
  do {
   if ($135) {
    $136 = (($mem) + ($8)|0);
    $137 = HEAP32[$136>>2]|0;
    $$sum2324 = $8 | 4;
    $138 = (($mem) + ($$sum2324)|0);
    $139 = HEAP32[$138>>2]|0;
    $140 = $134 << 1;
    $141 = ((6680 + ($140<<2)|0) + 40|0);
    $142 = ($137|0)==($141|0);
    if (!($142)) {
     $143 = HEAP32[((6680 + 16|0))>>2]|0;
     $144 = ($137>>>0)<($143>>>0);
     if ($144) {
      _abort();
      // unreachable;
     }
     $145 = (($137) + 12|0);
     $146 = HEAP32[$145>>2]|0;
     $147 = ($146|0)==($9|0);
     if (!($147)) {
      _abort();
      // unreachable;
     }
    }
    $148 = ($139|0)==($137|0);
    if ($148) {
     $149 = 1 << $134;
     $150 = $149 ^ -1;
     $151 = HEAP32[6680>>2]|0;
     $152 = $151 & $150;
     HEAP32[6680>>2] = $152;
     break;
    }
    $153 = ($139|0)==($141|0);
    if ($153) {
     $$pre65 = (($139) + 8|0);
     $$pre$phi66Z2D = $$pre65;
    } else {
     $154 = HEAP32[((6680 + 16|0))>>2]|0;
     $155 = ($139>>>0)<($154>>>0);
     if ($155) {
      _abort();
      // unreachable;
     }
     $156 = (($139) + 8|0);
     $157 = HEAP32[$156>>2]|0;
     $158 = ($157|0)==($9|0);
     if ($158) {
      $$pre$phi66Z2D = $156;
     } else {
      _abort();
      // unreachable;
     }
    }
    $159 = (($137) + 12|0);
    HEAP32[$159>>2] = $139;
    HEAP32[$$pre$phi66Z2D>>2] = $137;
   } else {
    $$sum5 = (($8) + 16)|0;
    $160 = (($mem) + ($$sum5)|0);
    $161 = HEAP32[$160>>2]|0;
    $$sum67 = $8 | 4;
    $162 = (($mem) + ($$sum67)|0);
    $163 = HEAP32[$162>>2]|0;
    $164 = ($163|0)==($9|0);
    do {
     if ($164) {
      $$sum9 = (($8) + 12)|0;
      $175 = (($mem) + ($$sum9)|0);
      $176 = HEAP32[$175>>2]|0;
      $177 = ($176|0)==(0|0);
      if ($177) {
       $$sum8 = (($8) + 8)|0;
       $178 = (($mem) + ($$sum8)|0);
       $179 = HEAP32[$178>>2]|0;
       $180 = ($179|0)==(0|0);
       if ($180) {
        $R7$1 = 0;
        break;
       } else {
        $R7$0$ph = $179;$RP9$0$ph = $178;
       }
      } else {
       $R7$0$ph = $176;$RP9$0$ph = $175;
      }
      $R7$0 = $R7$0$ph;$RP9$0 = $RP9$0$ph;
      while(1) {
       $181 = (($R7$0) + 20|0);
       $182 = HEAP32[$181>>2]|0;
       $183 = ($182|0)==(0|0);
       if ($183) {
        $184 = (($R7$0) + 16|0);
        $185 = HEAP32[$184>>2]|0;
        $186 = ($185|0)==(0|0);
        if ($186) {
         $R7$0$lcssa = $R7$0;$RP9$0$lcssa = $RP9$0;
         break;
        } else {
         $R7$0$be = $185;$RP9$0$be = $184;
        }
       } else {
        $R7$0$be = $182;$RP9$0$be = $181;
       }
       $R7$0 = $R7$0$be;$RP9$0 = $RP9$0$be;
      }
      $187 = HEAP32[((6680 + 16|0))>>2]|0;
      $188 = ($RP9$0$lcssa>>>0)<($187>>>0);
      if ($188) {
       _abort();
       // unreachable;
      } else {
       HEAP32[$RP9$0$lcssa>>2] = 0;
       $R7$1 = $R7$0$lcssa;
       break;
      }
     } else {
      $165 = (($mem) + ($8)|0);
      $166 = HEAP32[$165>>2]|0;
      $167 = HEAP32[((6680 + 16|0))>>2]|0;
      $168 = ($166>>>0)<($167>>>0);
      if ($168) {
       _abort();
       // unreachable;
      }
      $169 = (($166) + 12|0);
      $170 = HEAP32[$169>>2]|0;
      $171 = ($170|0)==($9|0);
      if (!($171)) {
       _abort();
       // unreachable;
      }
      $172 = (($163) + 8|0);
      $173 = HEAP32[$172>>2]|0;
      $174 = ($173|0)==($9|0);
      if ($174) {
       HEAP32[$169>>2] = $163;
       HEAP32[$172>>2] = $166;
       $R7$1 = $163;
       break;
      } else {
       _abort();
       // unreachable;
      }
     }
    } while(0);
    $189 = ($161|0)==(0|0);
    if (!($189)) {
     $$sum18 = (($8) + 20)|0;
     $190 = (($mem) + ($$sum18)|0);
     $191 = HEAP32[$190>>2]|0;
     $192 = ((6680 + ($191<<2)|0) + 304|0);
     $193 = HEAP32[$192>>2]|0;
     $194 = ($9|0)==($193|0);
     if ($194) {
      HEAP32[$192>>2] = $R7$1;
      $cond54 = ($R7$1|0)==(0|0);
      if ($cond54) {
       $195 = 1 << $191;
       $196 = $195 ^ -1;
       $197 = HEAP32[((6680 + 4|0))>>2]|0;
       $198 = $197 & $196;
       HEAP32[((6680 + 4|0))>>2] = $198;
       break;
      }
     } else {
      $199 = HEAP32[((6680 + 16|0))>>2]|0;
      $200 = ($161>>>0)<($199>>>0);
      if ($200) {
       _abort();
       // unreachable;
      }
      $201 = (($161) + 16|0);
      $202 = HEAP32[$201>>2]|0;
      $203 = ($202|0)==($9|0);
      if ($203) {
       HEAP32[$201>>2] = $R7$1;
      } else {
       $204 = (($161) + 20|0);
       HEAP32[$204>>2] = $R7$1;
      }
      $205 = ($R7$1|0)==(0|0);
      if ($205) {
       break;
      }
     }
     $206 = HEAP32[((6680 + 16|0))>>2]|0;
     $207 = ($R7$1>>>0)<($206>>>0);
     if ($207) {
      _abort();
      // unreachable;
     }
     $208 = (($R7$1) + 24|0);
     HEAP32[$208>>2] = $161;
     $$sum19 = (($8) + 8)|0;
     $209 = (($mem) + ($$sum19)|0);
     $210 = HEAP32[$209>>2]|0;
     $211 = ($210|0)==(0|0);
     do {
      if (!($211)) {
       $212 = ($210>>>0)<($206>>>0);
       if ($212) {
        _abort();
        // unreachable;
       } else {
        $213 = (($R7$1) + 16|0);
        HEAP32[$213>>2] = $210;
        $214 = (($210) + 24|0);
        HEAP32[$214>>2] = $R7$1;
        break;
       }
      }
     } while(0);
     $$sum20 = (($8) + 12)|0;
     $215 = (($mem) + ($$sum20)|0);
     $216 = HEAP32[$215>>2]|0;
     $217 = ($216|0)==(0|0);
     if (!($217)) {
      $218 = HEAP32[((6680 + 16|0))>>2]|0;
      $219 = ($216>>>0)<($218>>>0);
      if ($219) {
       _abort();
       // unreachable;
      } else {
       $220 = (($R7$1) + 20|0);
       HEAP32[$220>>2] = $216;
       $221 = (($216) + 24|0);
       HEAP32[$221>>2] = $R7$1;
       break;
      }
     }
    }
   }
  } while(0);
  $222 = $133 | 1;
  $223 = (($p$0) + 4|0);
  HEAP32[$223>>2] = $222;
  $224 = (($p$0) + ($133)|0);
  HEAP32[$224>>2] = $133;
  $225 = HEAP32[((6680 + 20|0))>>2]|0;
  $226 = ($p$0|0)==($225|0);
  if ($226) {
   HEAP32[((6680 + 8|0))>>2] = $133;
   return;
  } else {
   $psize$1 = $133;
  }
 } else {
  $227 = $112 & -2;
  HEAP32[$111>>2] = $227;
  $228 = $psize$0 | 1;
  $229 = (($p$0) + 4|0);
  HEAP32[$229>>2] = $228;
  $230 = (($p$0) + ($psize$0)|0);
  HEAP32[$230>>2] = $psize$0;
  $psize$1 = $psize$0;
 }
 $231 = $psize$1 >>> 3;
 $232 = ($psize$1>>>0)<(256);
 if ($232) {
  $233 = $231 << 1;
  $234 = ((6680 + ($233<<2)|0) + 40|0);
  $235 = HEAP32[6680>>2]|0;
  $236 = 1 << $231;
  $237 = $235 & $236;
  $238 = ($237|0)==(0);
  if ($238) {
   $239 = $235 | $236;
   HEAP32[6680>>2] = $239;
   $$sum16$pre = (($233) + 2)|0;
   $$pre = ((6680 + ($$sum16$pre<<2)|0) + 40|0);
   $$pre$phiZ2D = $$pre;$F16$0 = $234;
  } else {
   $$sum17 = (($233) + 2)|0;
   $240 = ((6680 + ($$sum17<<2)|0) + 40|0);
   $241 = HEAP32[$240>>2]|0;
   $242 = HEAP32[((6680 + 16|0))>>2]|0;
   $243 = ($241>>>0)<($242>>>0);
   if ($243) {
    _abort();
    // unreachable;
   } else {
    $$pre$phiZ2D = $240;$F16$0 = $241;
   }
  }
  HEAP32[$$pre$phiZ2D>>2] = $p$0;
  $244 = (($F16$0) + 12|0);
  HEAP32[$244>>2] = $p$0;
  $245 = (($p$0) + 8|0);
  HEAP32[$245>>2] = $F16$0;
  $246 = (($p$0) + 12|0);
  HEAP32[$246>>2] = $234;
  return;
 }
 $247 = $psize$1 >>> 8;
 $248 = ($247|0)==(0);
 if ($248) {
  $I18$0 = 0;
 } else {
  $249 = ($psize$1>>>0)>(16777215);
  if ($249) {
   $I18$0 = 31;
  } else {
   $250 = (($247) + 1048320)|0;
   $251 = $250 >>> 16;
   $252 = $251 & 8;
   $253 = $247 << $252;
   $254 = (($253) + 520192)|0;
   $255 = $254 >>> 16;
   $256 = $255 & 4;
   $257 = $256 | $252;
   $258 = $253 << $256;
   $259 = (($258) + 245760)|0;
   $260 = $259 >>> 16;
   $261 = $260 & 2;
   $262 = $257 | $261;
   $263 = (14 - ($262))|0;
   $264 = $258 << $261;
   $265 = $264 >>> 15;
   $266 = (($263) + ($265))|0;
   $267 = $266 << 1;
   $268 = (($266) + 7)|0;
   $269 = $psize$1 >>> $268;
   $270 = $269 & 1;
   $271 = $270 | $267;
   $I18$0 = $271;
  }
 }
 $272 = ((6680 + ($I18$0<<2)|0) + 304|0);
 $273 = (($p$0) + 28|0);
 $I18$0$c = $I18$0;
 HEAP32[$273>>2] = $I18$0$c;
 $274 = (($p$0) + 20|0);
 HEAP32[$274>>2] = 0;
 $275 = (($p$0) + 16|0);
 HEAP32[$275>>2] = 0;
 $276 = HEAP32[((6680 + 4|0))>>2]|0;
 $277 = 1 << $I18$0;
 $278 = $276 & $277;
 $279 = ($278|0)==(0);
 L205: do {
  if ($279) {
   $280 = $276 | $277;
   HEAP32[((6680 + 4|0))>>2] = $280;
   HEAP32[$272>>2] = $p$0;
   $281 = (($p$0) + 24|0);
   HEAP32[$281>>2] = $272;
   $282 = (($p$0) + 12|0);
   HEAP32[$282>>2] = $p$0;
   $283 = (($p$0) + 8|0);
   HEAP32[$283>>2] = $p$0;
  } else {
   $284 = HEAP32[$272>>2]|0;
   $285 = ($I18$0|0)==(31);
   if ($285) {
    $293 = 0;
   } else {
    $286 = $I18$0 >>> 1;
    $287 = (25 - ($286))|0;
    $293 = $287;
   }
   $288 = (($284) + 4|0);
   $289 = HEAP32[$288>>2]|0;
   $290 = $289 & -8;
   $291 = ($290|0)==($psize$1|0);
   do {
    if ($291) {
     $T$0$lcssa = $284;
    } else {
     $292 = $psize$1 << $293;
     $K19$060 = $292;$T$059 = $284;
     while(1) {
      $300 = $K19$060 >>> 31;
      $301 = ((($T$059) + ($300<<2)|0) + 16|0);
      $296 = HEAP32[$301>>2]|0;
      $302 = ($296|0)==(0|0);
      if ($302) {
       $$lcssa = $301;$T$059$lcssa = $T$059;
       break;
      }
      $294 = $K19$060 << 1;
      $295 = (($296) + 4|0);
      $297 = HEAP32[$295>>2]|0;
      $298 = $297 & -8;
      $299 = ($298|0)==($psize$1|0);
      if ($299) {
       $$lcssa73 = $296;
       label = 137;
       break;
      } else {
       $K19$060 = $294;$T$059 = $296;
      }
     }
     if ((label|0) == 137) {
      $T$0$lcssa = $$lcssa73;
      break;
     }
     $303 = HEAP32[((6680 + 16|0))>>2]|0;
     $304 = ($$lcssa>>>0)<($303>>>0);
     if ($304) {
      _abort();
      // unreachable;
     } else {
      HEAP32[$$lcssa>>2] = $p$0;
      $305 = (($p$0) + 24|0);
      HEAP32[$305>>2] = $T$059$lcssa;
      $306 = (($p$0) + 12|0);
      HEAP32[$306>>2] = $p$0;
      $307 = (($p$0) + 8|0);
      HEAP32[$307>>2] = $p$0;
      break L205;
     }
    }
   } while(0);
   $308 = (($T$0$lcssa) + 8|0);
   $309 = HEAP32[$308>>2]|0;
   $310 = HEAP32[((6680 + 16|0))>>2]|0;
   $311 = ($T$0$lcssa>>>0)>=($310>>>0);
   $312 = ($309>>>0)>=($310>>>0);
   $or$cond = $311 & $312;
   if ($or$cond) {
    $313 = (($309) + 12|0);
    HEAP32[$313>>2] = $p$0;
    HEAP32[$308>>2] = $p$0;
    $314 = (($p$0) + 8|0);
    HEAP32[$314>>2] = $309;
    $315 = (($p$0) + 12|0);
    HEAP32[$315>>2] = $T$0$lcssa;
    $316 = (($p$0) + 24|0);
    HEAP32[$316>>2] = 0;
    break;
   } else {
    _abort();
    // unreachable;
   }
  }
 } while(0);
 $317 = HEAP32[((6680 + 32|0))>>2]|0;
 $318 = (($317) + -1)|0;
 HEAP32[((6680 + 32|0))>>2] = $318;
 $319 = ($318|0)==(0);
 if (!($319)) {
  return;
 }
 $sp$0$in$i = ((6680 + 456|0));
 while(1) {
  $sp$0$i = HEAP32[$sp$0$in$i>>2]|0;
  $320 = ($sp$0$i|0)==(0|0);
  $321 = (($sp$0$i) + 8|0);
  if ($320) {
   break;
  } else {
   $sp$0$in$i = $321;
  }
 }
 HEAP32[((6680 + 32|0))>>2] = -1;
 return;
}
function runPostSets() {
 
}
function _memset(ptr, value, num) {
    ptr = ptr|0; value = value|0; num = num|0;
    var stop = 0, value4 = 0, stop4 = 0, unaligned = 0;
    stop = (ptr + num)|0;
    if ((num|0) >= 20) {
      // This is unaligned, but quite large, so work hard to get to aligned settings
      value = value & 0xff;
      unaligned = ptr & 3;
      value4 = value | (value << 8) | (value << 16) | (value << 24);
      stop4 = stop & ~3;
      if (unaligned) {
        unaligned = (ptr + 4 - unaligned)|0;
        while ((ptr|0) < (unaligned|0)) { // no need to check for stop, since we have large num
          HEAP8[((ptr)>>0)]=value;
          ptr = (ptr+1)|0;
        }
      }
      while ((ptr|0) < (stop4|0)) {
        HEAP32[((ptr)>>2)]=value4;
        ptr = (ptr+4)|0;
      }
    }
    while ((ptr|0) < (stop|0)) {
      HEAP8[((ptr)>>0)]=value;
      ptr = (ptr+1)|0;
    }
    return (ptr-num)|0;
}
function _strlen(ptr) {
    ptr = ptr|0;
    var curr = 0;
    curr = ptr;
    while (((HEAP8[((curr)>>0)])|0)) {
      curr = (curr + 1)|0;
    }
    return (curr - ptr)|0;
}
function _memcpy(dest, src, num) {

    dest = dest|0; src = src|0; num = num|0;
    var ret = 0;
    if ((num|0) >= 4096) return _emscripten_memcpy_big(dest|0, src|0, num|0)|0;
    ret = dest|0;
    if ((dest&3) == (src&3)) {
      while (dest & 3) {
        if ((num|0) == 0) return ret|0;
        HEAP8[((dest)>>0)]=((HEAP8[((src)>>0)])|0);
        dest = (dest+1)|0;
        src = (src+1)|0;
        num = (num-1)|0;
      }
      while ((num|0) >= 4) {
        HEAP32[((dest)>>2)]=((HEAP32[((src)>>2)])|0);
        dest = (dest+4)|0;
        src = (src+4)|0;
        num = (num-4)|0;
      }
    }
    while ((num|0) > 0) {
      HEAP8[((dest)>>0)]=((HEAP8[((src)>>0)])|0);
      dest = (dest+1)|0;
      src = (src+1)|0;
      num = (num-1)|0;
    }
    return ret|0;
}

  
function dynCall_viiiii(index,a1,a2,a3,a4,a5) {
  index = index|0;
  a1=a1|0; a2=a2|0; a3=a3|0; a4=a4|0; a5=a5|0;
  FUNCTION_TABLE_viiiii[index&31](a1|0,a2|0,a3|0,a4|0,a5|0);
}


function dynCall_vi(index,a1) {
  index = index|0;
  a1=a1|0;
  FUNCTION_TABLE_vi[index&31](a1|0);
}


function dynCall_vii(index,a1,a2) {
  index = index|0;
  a1=a1|0; a2=a2|0;
  FUNCTION_TABLE_vii[index&7](a1|0,a2|0);
}


function dynCall_iiii(index,a1,a2,a3) {
  index = index|0;
  a1=a1|0; a2=a2|0; a3=a3|0;
  return FUNCTION_TABLE_iiii[index&15](a1|0,a2|0,a3|0)|0;
}


function dynCall_v(index) {
  index = index|0;
  
  FUNCTION_TABLE_v[index&3]();
}


function dynCall_viiiiii(index,a1,a2,a3,a4,a5,a6) {
  index = index|0;
  a1=a1|0; a2=a2|0; a3=a3|0; a4=a4|0; a5=a5|0; a6=a6|0;
  FUNCTION_TABLE_viiiiii[index&31](a1|0,a2|0,a3|0,a4|0,a5|0,a6|0);
}


function dynCall_viiii(index,a1,a2,a3,a4) {
  index = index|0;
  a1=a1|0; a2=a2|0; a3=a3|0; a4=a4|0;
  FUNCTION_TABLE_viiii[index&31](a1|0,a2|0,a3|0,a4|0);
}

function b0(p0,p1,p2,p3,p4) { p0 = p0|0;p1 = p1|0;p2 = p2|0;p3 = p3|0;p4 = p4|0; nullFunc_viiiii(0); }
function b1(p0) { p0 = p0|0; nullFunc_vi(1); }
function b2(p0,p1) { p0 = p0|0;p1 = p1|0; nullFunc_vii(2); }
function b3(p0,p1,p2) { p0 = p0|0;p1 = p1|0;p2 = p2|0; nullFunc_iiii(3);return 0; }
function b4() { ; nullFunc_v(4); }
function ___cxa_pure_virtual__wrapper() { ; ___cxa_pure_virtual(); }
function b5(p0,p1,p2,p3,p4,p5) { p0 = p0|0;p1 = p1|0;p2 = p2|0;p3 = p3|0;p4 = p4|0;p5 = p5|0; nullFunc_viiiiii(5); }
function b6(p0,p1,p2,p3) { p0 = p0|0;p1 = p1|0;p2 = p2|0;p3 = p3|0; nullFunc_viiii(6); }

// EMSCRIPTEN_END_FUNCS
var FUNCTION_TABLE_viiiii = [b0,b0,b0,b0,b0,b0,b0,b0,b0,b0,b0,b0,b0,b0,__ZNK10__cxxabiv117__class_type_info16search_below_dstEPNS_19__dynamic_cast_infoEPKvib,b0,b0,b0,__ZNK10__cxxabiv120__si_class_type_info16search_below_dstEPNS_19__dynamic_cast_infoEPKvib,b0,b0,b0,b0,b0,b0,b0,b0,b0,b0
,b0,b0,b0];
var FUNCTION_TABLE_vi = [b1,b1,b1,b1,b1,b1,b1,b1,__ZN10__cxxabiv116__shim_type_infoD2Ev,__ZN10__cxxabiv117__class_type_infoD0Ev,__ZNK10__cxxabiv116__shim_type_info5noop1Ev,__ZNK10__cxxabiv116__shim_type_info5noop2Ev,b1,b1,b1,b1,__ZN10__cxxabiv120__si_class_type_infoD0Ev,b1,b1,b1,b1,b1,b1,b1,b1,b1,b1,b1,b1
,b1,b1,b1];
var FUNCTION_TABLE_vii = [b2,__ZN6squish10ClusterFit9Compress3EPv,__ZN6squish10ClusterFit9Compress4EPv,b2,__ZN6squish8RangeFit9Compress3EPv,__ZN6squish8RangeFit9Compress4EPv,__ZN6squish15SingleColourFit9Compress3EPv,__ZN6squish15SingleColourFit9Compress4EPv];
var FUNCTION_TABLE_iiii = [b3,b3,b3,b3,b3,b3,b3,b3,b3,b3,b3,b3,__ZNK10__cxxabiv117__class_type_info9can_catchEPKNS_16__shim_type_infoERPv,b3,b3,b3];
var FUNCTION_TABLE_v = [b4,b4,b4,___cxa_pure_virtual__wrapper];
var FUNCTION_TABLE_viiiiii = [b5,b5,b5,b5,b5,b5,b5,b5,b5,b5,b5,b5,b5,__ZNK10__cxxabiv117__class_type_info16search_above_dstEPNS_19__dynamic_cast_infoEPKvS4_ib,b5,b5,b5,__ZNK10__cxxabiv120__si_class_type_info16search_above_dstEPNS_19__dynamic_cast_infoEPKvS4_ib,b5,b5,b5,b5,b5,b5,b5,b5,b5,b5,b5
,b5,b5,b5];
var FUNCTION_TABLE_viiii = [b6,b6,b6,b6,b6,b6,b6,b6,b6,b6,b6,b6,b6,b6,b6,__ZNK10__cxxabiv117__class_type_info27has_unambiguous_public_baseEPNS_19__dynamic_cast_infoEPvi,b6,b6,b6,__ZNK10__cxxabiv120__si_class_type_info27has_unambiguous_public_baseEPNS_19__dynamic_cast_infoEPvi,b6,b6,b6,b6,b6,b6,b6,b6,b6
,b6,b6,b6];

  return { _CompressImage: _CompressImage, _strlen: _strlen, _free: _free, _DecompressImage: _DecompressImage, _memset: _memset, _malloc: _malloc, _memcpy: _memcpy, _GetStorageRequirements: _GetStorageRequirements, runPostSets: runPostSets, stackAlloc: stackAlloc, stackSave: stackSave, stackRestore: stackRestore, setThrew: setThrew, setTempRet0: setTempRet0, getTempRet0: getTempRet0, dynCall_viiiii: dynCall_viiiii, dynCall_vi: dynCall_vi, dynCall_vii: dynCall_vii, dynCall_iiii: dynCall_iiii, dynCall_v: dynCall_v, dynCall_viiiiii: dynCall_viiiiii, dynCall_viiii: dynCall_viiii };
})
// EMSCRIPTEN_END_ASM
(Module.asmGlobalArg, Module.asmLibraryArg, buffer);
var real__CompressImage = asm["_CompressImage"]; asm["_CompressImage"] = function() {
assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
return real__CompressImage.apply(null, arguments);
};

var real__strlen = asm["_strlen"]; asm["_strlen"] = function() {
assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
return real__strlen.apply(null, arguments);
};

var real__DecompressImage = asm["_DecompressImage"]; asm["_DecompressImage"] = function() {
assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
return real__DecompressImage.apply(null, arguments);
};

var real__GetStorageRequirements = asm["_GetStorageRequirements"]; asm["_GetStorageRequirements"] = function() {
assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
return real__GetStorageRequirements.apply(null, arguments);
};

var real_runPostSets = asm["runPostSets"]; asm["runPostSets"] = function() {
assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
return real_runPostSets.apply(null, arguments);
};
var _CompressImage = Module["_CompressImage"] = asm["_CompressImage"];
var _strlen = Module["_strlen"] = asm["_strlen"];
var _free = Module["_free"] = asm["_free"];
var _DecompressImage = Module["_DecompressImage"] = asm["_DecompressImage"];
var _memset = Module["_memset"] = asm["_memset"];
var _malloc = Module["_malloc"] = asm["_malloc"];
var _memcpy = Module["_memcpy"] = asm["_memcpy"];
var _GetStorageRequirements = Module["_GetStorageRequirements"] = asm["_GetStorageRequirements"];
var runPostSets = Module["runPostSets"] = asm["runPostSets"];
var dynCall_viiiii = Module["dynCall_viiiii"] = asm["dynCall_viiiii"];
var dynCall_vi = Module["dynCall_vi"] = asm["dynCall_vi"];
var dynCall_vii = Module["dynCall_vii"] = asm["dynCall_vii"];
var dynCall_iiii = Module["dynCall_iiii"] = asm["dynCall_iiii"];
var dynCall_v = Module["dynCall_v"] = asm["dynCall_v"];
var dynCall_viiiiii = Module["dynCall_viiiiii"] = asm["dynCall_viiiiii"];
var dynCall_viiii = Module["dynCall_viiii"] = asm["dynCall_viiii"];

Runtime.stackAlloc = asm['stackAlloc'];
Runtime.stackSave = asm['stackSave'];
Runtime.stackRestore = asm['stackRestore'];
Runtime.setTempRet0 = asm['setTempRet0'];
Runtime.getTempRet0 = asm['getTempRet0'];


// Warning: printing of i64 values may be slightly rounded! No deep i64 math used, so precise i64 code not included
var i64Math = null;

// === Auto-generated postamble setup entry stuff ===

if (memoryInitializer) {
  if (typeof Module['locateFile'] === 'function') {
    memoryInitializer = Module['locateFile'](memoryInitializer);
  } else if (Module['memoryInitializerPrefixURL']) {
    memoryInitializer = Module['memoryInitializerPrefixURL'] + memoryInitializer;
  }
  if (ENVIRONMENT_IS_NODE || ENVIRONMENT_IS_SHELL) {
    var data = Module['readBinary'](memoryInitializer);
    HEAPU8.set(data, STATIC_BASE);
  } else {
    addRunDependency('memory initializer');
    function applyMemoryInitializer(data) {
      if (data.byteLength) data = new Uint8Array(data);
      for (var i = 0; i < data.length; i++) {
        assert(HEAPU8[STATIC_BASE + i] === 0, "area for memory initializer should not have been touched before it's loaded");
      }
      HEAPU8.set(data, STATIC_BASE);
      removeRunDependency('memory initializer');
    }
    var request = Module['memoryInitializerRequest'];
    if (request) {
      // a network request has already been created, just use that
      if (request.response) {
        setTimeout(function() {
          applyMemoryInitializer(request.response);
        }, 0); // it's already here; but, apply it asynchronously
      } else {
        request.addEventListener('load', function() { // wait for it
          if (request.status !== 200 && request.status !== 0) {
            console.warn('a problem seems to have happened with Module.memoryInitializerRequest, status: ' + request.status);
          }
          if (!request.response || typeof request.response !== 'object' || !request.response.byteLength) {
            console.warn('a problem seems to have happened with Module.memoryInitializerRequest response (expected ArrayBuffer): ' + request.response);
          }
          applyMemoryInitializer(request.response);
        });
      }
    } else {
      // fetch it from the network ourselves
      Browser.asyncLoad(memoryInitializer, applyMemoryInitializer, function() {
        throw 'could not load memory initializer ' + memoryInitializer;
      });
    }
  }
}

function ExitStatus(status) {
  this.name = "ExitStatus";
  this.message = "Program terminated with exit(" + status + ")";
  this.status = status;
};
ExitStatus.prototype = new Error();
ExitStatus.prototype.constructor = ExitStatus;

var initialStackTop;
var preloadStartTime = null;
var calledMain = false;

dependenciesFulfilled = function runCaller() {
  // If run has never been called, and we should call run (INVOKE_RUN is true, and Module.noInitialRun is not false)
  if (!Module['calledRun']) run();
  if (!Module['calledRun']) dependenciesFulfilled = runCaller; // try this again later, after new deps are fulfilled
}

Module['callMain'] = Module.callMain = function callMain(args) {
  assert(runDependencies == 0, 'cannot call main when async dependencies remain! (listen on __ATMAIN__)');
  assert(__ATPRERUN__.length == 0, 'cannot call main when preRun functions remain to be called');

  args = args || [];

  ensureInitRuntime();

  var argc = args.length+1;
  function pad() {
    for (var i = 0; i < 4-1; i++) {
      argv.push(0);
    }
  }
  var argv = [allocate(intArrayFromString(Module['thisProgram']), 'i8', ALLOC_NORMAL) ];
  pad();
  for (var i = 0; i < argc-1; i = i + 1) {
    argv.push(allocate(intArrayFromString(args[i]), 'i8', ALLOC_NORMAL));
    pad();
  }
  argv.push(0);
  argv = allocate(argv, 'i32', ALLOC_NORMAL);

  initialStackTop = STACKTOP;

  try {

    var ret = Module['_main'](argc, argv, 0);


    // if we're not running an evented main loop, it's time to exit
    exit(ret);
  }
  catch(e) {
    if (e instanceof ExitStatus) {
      // exit() throws this once it's done to make sure execution
      // has been stopped completely
      return;
    } else if (e == 'SimulateInfiniteLoop') {
      // running an evented main loop, don't immediately exit
      Module['noExitRuntime'] = true;
      return;
    } else {
      if (e && typeof e === 'object' && e.stack) Module.printErr('exception thrown: ' + [e, e.stack]);
      throw e;
    }
  } finally {
    calledMain = true;
  }
}




function run(args) {
  args = args || Module['arguments'];

  if (preloadStartTime === null) preloadStartTime = Date.now();

  if (runDependencies > 0) {
    Module.printErr('run() called, but dependencies remain, so not running');
    return;
  }

  preRun();

  if (runDependencies > 0) return; // a preRun added a dependency, run will be called later
  if (Module['calledRun']) return; // run may have just been called through dependencies being fulfilled just in this very frame

  function doRun() {
    if (Module['calledRun']) return; // run may have just been called while the async setStatus time below was happening
    Module['calledRun'] = true;

    if (ABORT) return; 

    ensureInitRuntime();

    preMain();

    if (ENVIRONMENT_IS_WEB && preloadStartTime !== null) {
      Module.printErr('pre-main prep time: ' + (Date.now() - preloadStartTime) + ' ms');
    }

    if (Module['onRuntimeInitialized']) Module['onRuntimeInitialized']();

    if (Module['_main'] && shouldRunNow) Module['callMain'](args);

    postRun();
  }

  if (Module['setStatus']) {
    Module['setStatus']('Running...');
    setTimeout(function() {
      setTimeout(function() {
        Module['setStatus']('');
      }, 1);
      doRun();
    }, 1);
  } else {
    doRun();
  }
}
Module['run'] = Module.run = run;

function exit(status) {
  if (Module['noExitRuntime']) {
    Module.printErr('exit(' + status + ') called, but noExitRuntime, so not exiting (you can use emscripten_force_exit, if you want to force a true shutdown)');
    return;
  }

  ABORT = true;
  EXITSTATUS = status;
  STACKTOP = initialStackTop;

  // exit the runtime
  exitRuntime();

  if (Module['onExit']) Module['onExit'](status);

  if (ENVIRONMENT_IS_NODE) {
    // Work around a node.js bug where stdout buffer is not flushed at process exit:
    // Instead of process.exit() directly, wait for stdout flush event.
    // See https://github.com/joyent/node/issues/1669 and https://github.com/kripken/emscripten/issues/2582
    // Workaround is based on https://github.com/RReverser/acorn/commit/50ab143cecc9ed71a2d66f78b4aec3bb2e9844f6
    process['stdout']['once']('drain', function () {
      process['exit'](status);
    });
    console.log(' '); // Make sure to print something to force the drain event to occur, in case the stdout buffer was empty.
    // Work around another node bug where sometimes 'drain' is never fired - make another effort
    // to emit the exit status, after a significant delay (if node hasn't fired drain by then, give up)
    setTimeout(function() {
      process['exit'](status);
    }, 500);
  } else
  if (ENVIRONMENT_IS_SHELL && typeof quit === 'function') {
    quit(status);
  }
  // if we reach here, we must throw an exception to halt the current execution
  throw new ExitStatus(status);
}
Module['exit'] = Module.exit = exit;

var abortDecorators = [];

function abort(what) {
  if (what !== undefined) {
    Module.print(what);
    Module.printErr(what);
    what = JSON.stringify(what)
  } else {
    what = '';
  }

  ABORT = true;
  EXITSTATUS = 1;

  var extra = '';

  var output = 'abort(' + what + ') at ' + stackTrace() + extra;
  abortDecorators.forEach(function(decorator) {
    output = decorator(output, what);
  });
  throw output;
}
Module['abort'] = Module.abort = abort;

// {{PRE_RUN_ADDITIONS}}

if (Module['preInit']) {
  if (typeof Module['preInit'] == 'function') Module['preInit'] = [Module['preInit']];
  while (Module['preInit'].length > 0) {
    Module['preInit'].pop()();
  }
}

// shouldRunNow refers to calling main(), not run().
var shouldRunNow = true;
if (Module['noInitialRun']) {
  shouldRunNow = false;
}


run();

// {{POST_RUN_ADDITIONS}}






// {{MODULE_ADDITIONS}}



