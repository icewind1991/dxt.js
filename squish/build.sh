#! /usr/bin/bash

/usr/lib/emscripten/emcc -O2 -o ../src/squish.js ./*.cpp --memory-init-file 0 -s ALLOW_MEMORY_GROWTH=1 -s EXPORTED_FUNCTIONS="['_GetStorageRequirements','_CompressImage','_DecompressImage']"
/usr/lib/emscripten/emcc -O2 -o ../squish.bc ./*.cpp -s ALLOW_MEMORY_GROWTH=1 -s EXPORTED_FUNCTIONS="['_GetStorageRequirements','_CompressImage','_DecompressImage']"

# make the result work with browserify

MATCH='var ENVIRONMENT_IS_NODE=typeof process==="object"&&typeof require==="function";var ENVIRONMENT_IS_WEB=typeof window==="object";var ENVIRONMENT_IS_WORKER=typeof importScripts==="function";'

REPLACE='ENVIRONMENT_IS_WEB=typeof window==="object";var ENVIRONMENT_IS_WORKER=typeof importScripts==="function";var ENVIRONMENT_IS_NODE=typeof process==="object"&&typeof require==="function"&&!ENVIRONMENT_IS_WEB&&!ENVIRONMENT_IS_WORKER;if(typeof module!=="undefined"){module["exports"] = Module;}'

MATCH=$(sed -e 's/[]\/$*.^|[]/\\&/g' <<< $MATCH)
REPLACE=$(sed -e 's/[\/&]/\\&/g' <<< $REPLACE)

sed -i "s/$MATCH/$REPLACE/" ../src/squish.js

# The header we want

#var ENVIRONMENT_IS_WEB = typeof window === 'object';
#var ENVIRONMENT_IS_WORKER = typeof importScripts === 'function';
#var ENVIRONMENT_IS_NODE = (typeof process === 'object' && typeof require === 'function') && !ENVIRONMENT_IS_WEB && !ENVIRONMENT_IS_WORKER;
#var ENVIRONMENT_IS_SHELL = !ENVIRONMENT_IS_WEB && !ENVIRONMENT_IS_NODE && !ENVIRONMENT_IS_WORKER;
#
#if (typeof module !== 'undefined') {
#	module['exports'] = Module;
#}
