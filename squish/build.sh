#! /usr/bin/bash

/usr/lib/emscripten/emcc -O2 -o ../src/squish.js ./*.cpp --memory-init-file 0 -s ALLOW_MEMORY_GROWTH=1 -s EXPORTED_FUNCTIONS="['_GetStorageRequirements','_CompressImage','_DecompressImage']"
/usr/lib/emscripten/emcc -O2 -o ../squish.bc ./*.cpp -s ALLOW_MEMORY_GROWTH=1 -s EXPORTED_FUNCTIONS="['_GetStorageRequirements','_CompressImage','_DecompressImage']"

# fix module loading for browserify
echo 'if(typeof module!=="undefined"){module["exports"] = Module;}' >> ../src/squish.js;
