const Result = {
    UNDER: 0,
    OVER: 1,
    CYCLE: 2,
}

class SparseVertex {
    constructor(key){
        this.key = key;
        this.level = 1;
        this.outgoingEdges = new Map();
        this.incomingEdges = [];
    }
}

class SparseGraph {
    constructor(size) {
        this.vertices = [];
        this.canonical = new Union_find(size);
        this.edges = [];
        for (let i = 0; i < size; i++) {
            this.vertices.push(new SparseVertex(i));
        }
    }

    getComponents() {
        const components = new Map();
        for (let vertex of this.vertices) {
            const root = this.canonical.find(vertex.key);
            if (!components.has(root)) {
                components.set(root, []);
            }
            components.get(root).push(vertex.key);
        }
        return components;
    }

    getVertex(key){
        const v = this.vertices[key];
        return{
            key: v.key,
            level: v.level,
            components: this.canonical.find(v.key),
            out: [...v.outgoingEdges.values()].map((e) => `${e.from.key} → ${e.to.key}`),
            in: v.incomingEdges.map((p) => p.key)
        };
    }

    backSearch(u, z, B, path){
        let count = 0;
        let queue = [u];
        let cycle = false;
        // delta = min(pow(m, 1/2), pow(n, 2/3))
        let delta = Math.min(Math.floor(Math.pow(this.edges.length, 1/2)), Math.floor(Math.pow(this.vertices.length, 2/3)));
        B.add(u);
        path.push(u.key);

        while(queue.length > 0){
            const y = queue.shift();
            const M = new Array(this.vertices.length).fill(0);
            const search = [...y.incomingEdges];
            for(let x of search){
                let q = this.vertices[this.canonical.find(x.key)];
                const idx = y.incomingEdges.indexOf(x);
                if (idx !== -1) y.incomingEdges.splice(idx, 1);
                if (q.key !== y.key && M[q.key] === 0){
                    M[q.key] = 1;
                    y.incomingEdges.push(q);
                    if(q.key === z.key){
                        path.push(q.key);
                        cycle = true;
                    }else if(!B.has(q)){
                        B.add(q);
                        path.push(q.key);
                        queue.push(q);
                        count++;
                        if(count > delta){
                            return cycle ? Result.CYCLE : Result.OVER;
                        }
                    }
                }
            }
        }
        return cycle ? Result.CYCLE : Result.UNDER;
    }

    forwardSearch(u, z, B, path){
        const F = new Map(z.outgoingEdges);
        let cycle = false;
        while(F.size > 0){
            const firstKey = F.keys().next().value;
            const { from: x, to: y} = F.get(firstKey);
            F.delete(firstKey);
            const p = this.vertices[this.canonical.find(y.key)];
            if(B.has(p)){
                cycle = true;
            }
            if(p.level === z.level){
                p.incomingEdges.push(x);
            } else if(p.level < z.level){
                path.push(p.key);
                p.level = z.level;
                p.incomingEdges = [x];
                for(const [k, edge] of p.outgoingEdges){
                    F.set(k, edge);
                }
            }
        }
        return cycle;
    }

    markDFS(u, marked, seen){
        seen.add(u);
        for(const x of u.incomingEdges){
            const p = this.vertices[this.canonical.find(x.key)];
            if(!seen.has(p)){
                this.markDFS(p, marked, seen);
            }
            if(marked.has(p)){
                marked.add(this.vertices[this.canonical.find(u.key)]);
            }
        }

    }

    symmetricDifferenceUpdate(targetOUT, sourceOUT){
        for(const [k, edge] of sourceOUT){
            if(targetOUT.has(k)){
                targetOUT.delete(k);
            }else{
                targetOUT.set(k, edge);
            }
        }
    }

    fixComponents(u, z){
        const marked = new Set([z]);
        const seen = new Set();
        this.markDFS(u, marked, seen);
        const mergedKeys = [];
        for(const x of marked){
            if(x !== z){
                this.canonical.union(x.key, z.key);
                this.symmetricDifferenceUpdate(z.outgoingEdges, x.outgoingEdges);
                z.incomingEdges.push(...x.incomingEdges);
                mergedKeys.push(x.key);
            }
        }
        return mergedKeys;
    }

    *addEdgeSteps(from, to) {
        const u = this.vertices[this.canonical.find(from)];
        const z = this.vertices[this.canonical.find(to)];
        const v = this.vertices[from];
        const w = this.vertices[to];
        let cycle = false;
        let B = new Set();

        yield { path: [v.key, w.key], message: `Adding edge (${v.key}, ${w.key})` };

        if(u.key !== z.key && u.level >= z.level){
            const backPath = [];
            const res = this.backSearch(u, z, B, backPath);
            yield{path: backPath, message: "Back search walked through nodes " + backPath.join(" -> ") + " and ended with status: " + (res === Result.UNDER ? "UNDER" : res === Result.OVER ? "OVER" : "CYCLE" )};
            if(res === Result.UNDER && u.level > z.level){
                z.level = u.level;
                z.incomingEdges = [];
                const forwardPath = [];
                cycle = this.forwardSearch(u, z, B, forwardPath);
                yield{path: forwardPath, message: "Forward search walked through nodes " + forwardPath.join(" -> ") + " and " + (cycle ? " found a cycle" : " completed with no cycle")};
            }else if(res === Result.OVER){
                z.level = u.level+1;
                z.incomingEdges = [];
                B = new Set([u]);
                const forwardPath = [];
                cycle = this.forwardSearch(u, z, B, forwardPath);
                yield{path: forwardPath, message: "Forward search walked through nodes " + forwardPath.join(" -> ") + " and " + (cycle ? " found a cycle" : " completed with no cycle")};
            }else if(res === Result.CYCLE){
                cycle = true;
            }

            if(cycle){
                const mergedKeys = this.fixComponents(u, z);
                // add z to the mergedKeys
                mergedKeys.push(z.key);
                let mergedPath = [mergedKeys];
                yield{path: mergedKeys, message: `Merged components: ${mergedPath.join(", ")}`, highlightEdges: false};
            }
        }
        const x  = this.vertices[this.canonical.find(u.key)];
        x.outgoingEdges.set(`${v.key}->${w.key}`, {from: v, to: w});
        if(x.level === z.level){
            z.incomingEdges.push(v);
        }
        this.edges.push({from: v.key, to: w.key});
        return cycle;
    }

}