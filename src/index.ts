/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `wrangler dev src/index.ts` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `wrangler publish src/index.ts --name my-worker` to publish your worker
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */
//import "./finalization-registry";
import wasmBytes from "./automerge_wasm_bg.wasm";
import * as bg from "./automerge_wasm_bg.js";
//import * as bg from "./automerge_wasm"


const {create} = bg; 
export interface Env {
	// Example binding to KV. Learn more at https://developers.cloudflare.com/workers/runtime-apis/kv/
	// MY_KV_NAMESPACE: KVNamespace;
	//
	// Example binding to Durable Object. Learn more at https://developers.cloudflare.com/workers/runtime-apis/durable-objects/
	// MY_DURABLE_OBJECT: DurableObjectNamespace;
	//
	// Example binding to R2. Learn more at https://developers.cloudflare.com/workers/runtime-apis/r2/
	// MY_BUCKET: R2Bucket;
}

export default {
	async fetch(
		request: Request,
		env: Env,
		ctx: ExecutionContext
	): Promise<Response> {

    // This code can be used to extract imports
		// const imports = await fetch("http://localhost:8080/automerge_wasm_bg.wasm")
    //   .then((response) => response.arrayBuffer())
    //   .then((bytes) => WebAssembly.compile(bytes, {}))
    //   .then((module) => WebAssembly.Module.imports(module))
    //   .then(items => {
    //     const imports = {}
    //     items.forEach(item => imports[item.name] = bg[item.name]);
    //     return imports;
    //   });

    const module = await WebAssembly.instantiate(wasmBytes,bg.imports);
    bg.__wbg_set_wasm(module.exports)
		let doc = create();
		doc.put("/", "prop1", 100);
		let x = doc.materialize("_root");
		return new Response("Hello World!"+JSON.stringify(x));
	},
};
