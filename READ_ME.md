After npm installing @automerge/automerge

Copy:

  `automerge_wasm_bg.js`
  `automerge_wasm_bg.wasm`

in:
  
  `node_modules/@automerge/automerge-wasm/bundle/automerge_wasm.js` to `src`

Then we need to find the js imports that the wasm file uses. In src create a blank `index.html` and start a webserver:

```bash
cd src
npx http-server 
```

In Chrome visit `http://localhost:8080/index.html` (or whatever) and open the inspector and in the console paste the following:

```javascript
imports = await fetch("http://localhost:8080/automerge_wasm_bg.wasm")
  .then((response) => response.arrayBuffer())
  .then((bytes) => WebAssembly.compile(bytes, {}))
  .then((module) => WebAssembly.Module.imports(module));
copy(imports);
``` 

You should find a structure like this in you clipboard:

```javascript
[
    {
        "module": "./automerge_wasm_bg.js",
        "name": "__wbindgen_string_new",
        "kind": "function"
    },
    {
        "module": "./automerge_wasm_bg.js",
        "name": "__wbindgen_object_drop_ref",
        "kind": "function"
    },
    {
        "module": "./automerge_wasm_bg.js",
        "name": "__wbindgen_object_clone_ref",
        "kind": "function"
    }...
```

We need to map it to an object with this structure that can be placed at the bottom of `./automerge_wasm_bg.js`:

```javascript
export const imports = {
  "module": "./automerge_wasm_bg.js": {
    __wbindgen_string_new,
    __wbindgen_object_drop_ref,
    __wbindgen_object_clone_ref,
    ...
  }
}
```
You can get the list of function names like this:

```javascript
copy(imports.map(x => x.name))
```

and then just paste:

```javascript
export const imports = {
  "module": "./automerge_wasm_bg.js": {
    // paste list of function names here
  }
}
```
Next we need to remove the use of `FinalizationRegistry` as CloudFlare Workers does not support this. Comment out the following lines in  `./automerge_wasm_bg.js`.

```javascript
// const AutomergeFinalization = new FinalizationRegistry(ptr => wasm.__wbg_automerge_free(ptr));

export class Automerge {
    static __wrap(ptr) {
        const obj = Object.create(Automerge.prototype);
        obj.ptr = ptr;
//        AutomergeFinalization.register(obj, obj.ptr, obj);
        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.ptr;
        this.ptr = 0;
//        AutomergeFinalization.unregister(this);
        return ptr;
    }
```

and

```javascript
// const SyncStateFinalization = new FinalizationRegistry(ptr => wasm.__wbg_syncstate_free(ptr));

export class SyncState {

    static __wrap(ptr) {
        const obj = Object.create(SyncState.prototype);
        obj.ptr = ptr;
//        SyncStateFinalization.register(obj, obj.ptr, obj);
        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.ptr;
        this.ptr = 0;
//        SyncStateFinalization.unregister(this);
        return ptr;
    }
```

_You can also do this by recompiling the Rust removing the `--weak-ref` flag from where it occurs in the `package.json`._

You worker should now deploy and run.

Note you need to manually free memory:

```javascript
const { create, initSyncState } = bg;
let doc = create()
let sync = initSyncState()
doc.free()
sync.free()
```

The API for `@automerge/automerge-wasm` is lower level than `@automerge/automerge` docs are here:

https://github.com/automerge/automerge/tree/main/rust/automerge-wasm

