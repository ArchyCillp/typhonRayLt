class RelationshipGraph {
    constructor(nodes, edges) {
        this.nodes = nodes;
        this.edges = edges;
        this.adjacencyList = this.buildAdjacencyList();
        this.nameToIdMap = this.buildNameMap();
    }

    buildAdjacencyList() {
        const list = {};
        
        // 初始化所有节点
        this.nodes.forEach(node => {
            list[node.id] = [];
        });
        
        // 构建邻接表
        this.edges.forEach(edge => {
            list[edge.source].push({
                target: edge.target,
                relationship: edge.relationship,
                description: edge.description
            });
            
            // 如果是无向图，需要添加反向边
            list[edge.target].push({
                target: edge.source,
                relationship: edge.relationship,
                description: edge.description
            });
        });
        
        return list;
    }

    buildNameMap() {
        const map = {};
        this.nodes.forEach(node => {
            map[node.name] = node.id;
        });
        return map;
    }

    findShortestPath(personAName, personBName) {
        const personA = this.nameToIdMap[personAName];
        const personB = this.nameToIdMap[personBName];
        
        if (!personA || !personB) {
            return null;
        }

        if (personA === personB) {
            return [];
        }

        // BFS搜索最短路径
        const queue = [[personA]];
        const visited = new Set([personA]);

        while (queue.length > 0) {
            const path = queue.shift();
            const currentPerson = path[path.length - 1];

            if (currentPerson === personB) {
                return this.enrichPathWithDetails(path);
            }

            for (const neighbor of this.adjacencyList[currentPerson]) {
                if (!visited.has(neighbor.target)) {
                    visited.add(neighbor.target);
                    const newPath = [...path, neighbor.target];
                    queue.push(newPath);
                }
            }
        }

        return null; // 没有找到路径
    }

    enrichPathWithDetails(path) {
        const result = [];
        
        for (let i = 0; i < path.length - 1; i++) {
            const from = path[i];
            const to = path[i + 1];
            
            // 查找边信息
            const edge = this.findEdge(from, to);
            
            if (edge) {
                result.push({
                    from: this.getPersonName(from),
                    to: this.getPersonName(to),
                    relationship: edge.relationship,
                    description: edge.description
                });
            }
        }
        
        return result;
    }

    findEdge(from, to) {
        return this.edges.find(edge => 
            (edge.source === from && edge.target === to) || 
            (edge.source === to && edge.target === from)
        );
    }

    getPersonName(id) {
        const node = this.nodes.find(n => n.id === id);
        return node ? node.name : '未知人物';
    }

    getAllPersonNames() {
        return this.nodes.map(node => node.name).sort();
    }
}
