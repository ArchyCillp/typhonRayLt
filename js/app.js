////////////////////////////////////////////////////////////////////////////////////
// js/app.js
class App {
    constructor() {
        this.graph = null;
        this.init();
    }

    async init() {
        try {
            this.showLoading(true);
            
            // 加载数据
            const data = await this.loadData();
            this.graph = new RelationshipGraph(data.nodes, data.edges);
            
            // 初始化界面
            this.initUI();
            this.showLoading(false);
            
        } catch (error) {
            this.showError('数据加载失败: ' + error.message);
        }
    }

    async loadData() {
        const response = await fetch('./data/network.json');
        if (!response.ok) {
            throw new Error('网络请求失败');
        }
        return await response.json();
    }

    initUI() {
        // 填充人物列表
        const personList = document.getElementById('personList');
        const names = this.graph.getAllPersonNames();
        
        names.forEach(name => {
            const option = document.createElement('option');
            option.value = name;
            personList.appendChild(option);
        });

        // 绑定搜索事件
        document.getElementById('searchBtn').addEventListener('click', () => {
            this.search();
        });

        // 回车搜索
        document.getElementById('personA').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.search();
        });
        
        document.getElementById('personB').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.search();
        });
    }

    search() {
        const personA = document.getElementById('personA').value.trim();
        const personB = document.getElementById('personB').value.trim();
        
        this.clearResults();

        if (!personA || !personB) {
            this.showError('请输入两个人物名称');
            return;
        }

        if (personA === personB) {
            this.showError('请输入两个不同的人物');
            return;
        }

        const path = this.graph.findShortestPath(personA, personB);
        
        if (path === null) {
            this.showError('未找到这两个人物之间的关系路径');
        } else if (path.length === 0) {
            this.showResult('这是同一个人物');
        } else {
            this.displayPath(path);
        }
    }

    displayPath(path) {
        const resultDiv = document.getElementById('pathResult');
        resultDiv.innerHTML = '';
        
        path.forEach((step, index) => {
            const stepDiv = document.createElement('div');
            stepDiv.className = 'path-item';
            stepDiv.innerHTML = `
                <strong>${step.from}</strong> 
                → <strong>${step.to}</strong>
                <br>
                <em>剧情依据文件路径：${step.relationship}</em>
                <br>
                ${step.description}
            `;
            resultDiv.appendChild(stepDiv);
        });

        document.getElementById('result').classList.remove('hidden');
    }

    showLoading(show) {
        document.getElementById('loading').classList.toggle('hidden', !show);
    }

    showError(message) {
        const errorDiv = document.getElementById('error');
        errorDiv.textContent = message;
        errorDiv.classList.remove('hidden');
    }

    showResult(message) {
        const resultDiv = document.getElementById('pathResult');
        resultDiv.textContent = message;
        document.getElementById('result').classList.remove('hidden');
    }

    clearResults() {
        document.getElementById('error').classList.add('hidden');
        document.getElementById('result').classList.add('hidden');
    }
}

// 启动应用
document.addEventListener('DOMContentLoaded', () => {
    new App();
});
