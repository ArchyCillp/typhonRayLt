////////////////////////////////////////////////////////////////////////////////////
// js/graph.js
class RelationshipGraph {
    constructor(nodes, edges) {
        this.nodes = nodes;
        this.edges = edges;
        this.adjacencyList = this.buildAdjacencyList();
        this.nameToIdMap = this.buildNameMap();
        this.bannedNodes = this.buildBannedSet(); // 新增：构建禁止节点集合
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
            // 支持多个名字：names 数组中的每个名字都映射到同一个 id
            if (node.names && Array.isArray(node.names)) {
                node.names.forEach(name => {
                    map[name] = node.id;
                });
            } else {
                // 向后兼容：如果还是单个 name 字段
                map[node.name] = node.id;
            }
        });
        return map;
    }

    buildBannedSet() {
        // 新增：构建禁止节点集合
        const banned = new Set();
        this.nodes.forEach(node => {
            if (node.ban === true) {
                banned.add(node.id);
            }
        });
        return banned;
    }

    findShortestPath(personAName, personBName) {
        const personA = this.nameToIdMap[personAName];
        const personB = this.nameToIdMap[personBName];
        
        if (!personA || !personB) {
            return null;
        }

        // 新增：检查起点或终点是否被禁止
        if (this.bannedNodes.has(personA) || this.bannedNodes.has(personB)) {
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
                // 新增：检查邻居节点是否被禁止
                if (!this.bannedNodes.has(neighbor.target) && !visited.has(neighbor.target)) {
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
        if (!node) return '未知人物';
        
        // 返回第一个名字作为显示用（通常是主名）
        if (node.names && Array.isArray(node.names) && node.names.length > 0) {
            return node.names[0];
        }
        return node.name || '未知人物';
    }

    getAllPersonNames() {
        const allNames = [];
        this.nodes.forEach(node => {
            // 新增：只返回未被禁止的节点名称
            if (node.ban !== true) {
                if (node.names && Array.isArray(node.names)) {
                    // 添加所有名字
                    allNames.push(...node.names);
                } else {
                    // 向后兼容
                    allNames.push(node.name);
                }
            }
        });
        return allNames.sort();
    }
}