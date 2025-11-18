////////////////////////////////////////////////////////////////////////////////////
// js/graph.js
class RelationshipGraph {
    constructor(nodes, edges) {
        this.nodes = nodes;
        this.edges = edges;
        this.adjacencyList = this.buildAdjacencyList();
        this.nameToIdMap = this.buildNameMap();
        this.bannedNodes = this.buildBannedSet();
        this.nodeDegrees = this.calculateNodeDegrees(); 
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
        // 构建禁止节点集合
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

        // 检查起点或终点是否被禁止
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
                // 检查邻居节点是否被禁止
                if (!this.bannedNodes.has(neighbor.target) && !visited.has(neighbor.target)) {
                    visited.add(neighbor.target);
                    const newPath = [...path, neighbor.target];
                    queue.push(newPath);
                }
            }
        }

        return null; // 没有找到路径
    }

    findWeightedShortestPath(personAName, personBName) {
        const personA = this.nameToIdMap[personAName];
        const personB = this.nameToIdMap[personBName];
        
        if (!personA || !personB) {
            return null;
        }
    
        if (personA === personB) {
            return [];
        }
    
        // Dijkstra算法 - 智能路径不检查ban
        const distances = {};
        const previous = {};
        const visited = new Set();
        const priorityQueue = new MinPriorityQueue();
        
        // 初始化
        this.nodes.forEach(node => {
            distances[node.id] = node.id === personA ? 0 : Infinity;
            previous[node.id] = null;
        });
        
        priorityQueue.enqueue(personA, 0);
        
        while (!priorityQueue.isEmpty()) {
            const { element: currentPerson, priority: currentDistance } = priorityQueue.dequeue();
            
            if (visited.has(currentPerson)) continue;
            visited.add(currentPerson);
            
            if (currentPerson === personB) {
                // 构建路径
                const path = [];
                let node = personB;
                while (node !== null) {
                    path.unshift(node);
                    node = previous[node];
                }
                return this.enrichPathWithDetails(path, true); // 参数表示是智能路径
            }
            
            for (const neighbor of this.adjacencyList[currentPerson]) {
                if (visited.has(neighbor.target)) continue;
                
                // 计算权重：中间节点的度数作为cost
                // 起始和终止节点不计入
                let cost = 0;
                if (currentPerson !== personA && currentPerson !== personB) {
                    cost = this.nodeDegrees[currentPerson] || 1;
                }
                
                const newDistance = currentDistance + cost;
                
                if (newDistance < distances[neighbor.target]) {
                    distances[neighbor.target] = newDistance;
                    previous[neighbor.target] = currentPerson;
                    priorityQueue.enqueue(neighbor.target, newDistance);
                }
            }
        }
        
        return null; // 没有找到路径
    }

    enrichPathWithDetails(path, isWeightedPath = false) {
        const result = [];
        
        for (let i = 0; i < path.length - 1; i++) {
            const from = path[i];
            const to = path[i + 1];
            
            // 查找边信息
            const edge = this.findEdge(from, to);
            
            if (edge) {
                const fromDegree = this.nodeDegrees[from] || 0;
                const toDegree = this.nodeDegrees[to] || 0;
                
                result.push({
                    from: this.getPersonName(from),
                    to: this.getPersonName(to),
                    relationship: edge.relationship,
                    description: edge.description,
                    // 度数信息
                    fromDegree: fromDegree,
                    toDegree: toDegree,
                    isWeightedPath: isWeightedPath
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
            // 只返回未被禁止的节点名称
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

    findWeightedShortestPath(personAName, personBName) {
        const personA = this.nameToIdMap[personAName];
        const personB = this.nameToIdMap[personBName];
        
        if (!personA || !personB) {
            return null;
        }
    
        if (personA === personB) {
            return [];
        }
    
        // 计算所有节点的度数
        const degrees = this.calculateNodeDegrees();
        
        // Dijkstra算法
        const distances = {};
        const previous = {};
        const visited = new Set();
        const priorityQueue = new MinPriorityQueue();
        
        // 初始化
        this.nodes.forEach(node => {
            distances[node.id] = node.id === personA ? 0 : Infinity;
            previous[node.id] = null;
        });
        
        priorityQueue.enqueue(personA, 0);
        
        while (!priorityQueue.isEmpty()) {
            const { element: currentPerson, priority: currentDistance } = priorityQueue.dequeue();
            
            if (visited.has(currentPerson)) continue;
            visited.add(currentPerson);
            
            if (currentPerson === personB) {
                // 构建路径
                const path = [];
                let node = personB;
                while (node !== null) {
                    path.unshift(node);
                    node = previous[node];
                }
                return this.enrichPathWithDetails(path);
            }
            
            for (const neighbor of this.adjacencyList[currentPerson]) {
                if (visited.has(neighbor.target)) continue;
                
                // 计算权重：中间节点的度数作为cost
                // 起始和终止节点不计入
                let cost = 0;
                if (currentPerson !== personA && currentPerson !== personB) {
                    cost = degrees[currentPerson] || 1;
                }
                
                const newDistance = currentDistance + cost;
                
                if (newDistance < distances[neighbor.target]) {
                    distances[neighbor.target] = newDistance;
                    previous[neighbor.target] = currentPerson;
                    priorityQueue.enqueue(neighbor.target, newDistance);
                }
            }
        }
        
        return null; // 没有找到路径
    }
    
    calculateNodeDegrees() {
        const degrees = {};
        this.nodes.forEach(node => {
            degrees[node.id] = this.adjacencyList[node.id].length;
        });
        return degrees;
    }
}