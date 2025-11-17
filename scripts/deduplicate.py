import json

def remove_duplicate_edges(input_file, output_file):
    """
    删除重复的边，只保留一个方向的边
    比如同时存在 1->2 和 2->1，只保留 1->2
    """
    # 读取JSON文件
    with open(input_file, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    # 用于跟踪已处理的边对
    processed_pairs = set()
    unique_edges = []
    
    # 遍历所有边
    for edge in data['edges']:
        source = edge['source']
        target = edge['target']
        
        # 创建标准化的边对（按数字顺序排序）
        pair = tuple(sorted([source, target]))
        
        # 如果这个边对还没有被处理过，就保留当前边
        if pair not in processed_pairs:
            processed_pairs.add(pair)
            unique_edges.append(edge)
    
    # 更新数据
    data['edges'] = unique_edges
    
    # 保存处理后的数据
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    
    print(f"处理完成！原始边数: {len(data['edges']) + len(processed_pairs) - len(unique_edges)}")
    print(f"去重后边数: {len(unique_edges)}")
    print(f"删除了 {len(processed_pairs) - len(unique_edges)} 条重复边")

# 使用示例
if __name__ == "__main__":
    input_file = "network.json"  # 替换为你的输入文件路径
    output_file = "cleaned_output.json"  # 替换为你的输出文件路径
    
    remove_duplicate_edges(input_file, output_file)