import json

def convert_character_graph(original_data):
    """
    将原始人物关系图转换成指定结构
    """
    # 构建节点映射和边列表
    nodes_map = {}  # name -> id 映射
    nodes_list = []  # 节点列表
    edges_list = []  # 边列表
    
    # 第一步：收集所有节点（包括别名）
    node_id_counter = 1
    
    for chara in original_data["chara_queue"]:
        # 收集所有名称（主名+别名）
        all_names = [chara["main_name"]] + chara["alt_names"]
        
        # 为主名创建节点
        if chara["main_name"] not in nodes_map:
            nodes_map[chara["main_name"]] = str(node_id_counter)
            nodes_list.append({
                "id": str(node_id_counter),
                "names": all_names
            })
            node_id_counter += 1
        
        # 为每个别名也建立映射到同一个ID
        for alt_name in chara["alt_names"]:
            if alt_name and alt_name not in nodes_map:
                nodes_map[alt_name] = nodes_map[chara["main_name"]]
    
    # 第二步：处理边关系
    for chara in original_data["chara_queue"]:
        source_id = nodes_map[chara["main_name"]]
        
        for know in chara["knows"]:
            target_name = know["who"]
            
            # 如果目标人物在节点映射中
            if target_name in nodes_map:
                target_id = nodes_map[target_name]
                
                # 创建边（避免重复）
                edge = {
                    "source": source_id,
                    "target": target_id,
                    "relationship": know.get("reason_location", ""),
                    "description": know.get("reason", "")
                }
                
                # 检查是否已存在相同的边（避免重复）
                if not any(e["source"] == source_id and e["target"] == target_id for e in edges_list):
                    edges_list.append(edge)
    
    # 构建最终结果
    result = {
        "nodes": nodes_list,
        "edges": edges_list
    }
    
    return result

# 使用示例
if __name__ == "__main__":
    # 读取原始数据
    with open('raw.json', 'r', encoding='utf-8') as f:
        original_data = json.load(f)
    
    # 转换数据
    converted_data = convert_character_graph(original_data)
    
    # 保存转换后的数据
    with open('converted.json', 'w', encoding='utf-8') as f:
        json.dump(converted_data, f, ensure_ascii=False, indent=2)
    
    print(f"转换完成！共 {len(converted_data['nodes'])} 个节点，{len(converted_data['edges'])} 条边")