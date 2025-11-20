import json
import xml.etree.ElementTree as ET
from xml.dom import minidom

# 读取你的JSON数据
with open('network.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

# 创建GEXF根元素
gexf = ET.Element('gexf', xmlns='http://www.gexf.net/1.2draft', version='1.2')
graph = ET.SubElement(gexf, 'graph', mode='static', defaultedgetype='directed')

# 添加节点
nodes = ET.SubElement(graph, 'nodes')
for node in data['nodes']:
    node_elem = ET.SubElement(nodes, 'node', id=node['id'], label=node['names'][0])
    # 如果需要显示所有名称
    if len(node['names']) > 1:
        attrs = ET.SubElement(node_elem, 'attvalues')
        # 使用字典方式传递属性，避免关键字冲突
        attvalue_elem = ET.SubElement(attrs, 'attvalue')
        attvalue_elem.set('for', 'all_names')
        attvalue_elem.set('value', ','.join(node['names']))

# 添加边
edges = ET.SubElement(graph, 'edges')
for i, edge in enumerate(data['edges']):
    edge_elem = ET.SubElement(edges, 'edge', 
                             id=str(i),
                             source=edge['source'],
                             target=edge['target'])
    # 如果需要记录关系类型（去掉路径，只保留文件名）
    relationship = edge['relationship'].split('\\')[-1] if '\\' in edge['relationship'] else edge['relationship']
    edge_elem.set('label', relationship)

# 生成XML并保存
xml_str = minidom.parseString(ET.tostring(gexf, encoding='utf-8')).toprettyxml(indent='  ')
with open('network.gexf', 'w', encoding='utf-8') as f:
    f.write(xml_str)
    
print("Convert to network.gexf done!")
