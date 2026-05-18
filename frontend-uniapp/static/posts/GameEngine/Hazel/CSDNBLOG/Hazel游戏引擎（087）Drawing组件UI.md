> 文中若有代码、术语等错误，欢迎指正

[toc]

# 前言

- 此节目的

  点击实体，在属性面板里显示这个实体的**spriterenderer**组件的属性，应包括颜色、texture、shader什么的（纹理)，但目前先只显示颜色

- 如何实现

  同86 85节，只需判定是否有这个组件，然后传入ImGui的Api中

# 代码

```cpp
// 实体transform组件
if (entity.HasComponent<SpriteRendererComponent>()) {
    if (ImGui::TreeNodeEx((void*)typeid(SpriteRendererComponent).hash_code(), ImGuiTreeNodeFlags_DefaultOpen, "Sprite Renderer")) {
        auto& src = entity.GetComponent<SpriteRendererComponent>();
        ImGui::ColorEdit4("Color", glm::value_ptr(src.Color));
        // 展开树节点
        ImGui::TreePop();
    }
}
```

# 混合效果

- 前提

  绿色的先渲染、红色的后渲染

- 当两个的z**一样**，没有混合的效果

  ![](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202307302311170.png)

- 当红色z=**-0.5,** 绿色z=0,有混合效果

  红色在绿色后面，且红色**后**渲染，所以会混合

  ![](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202307302311173.png)

- 当红色z=0,绿色z=**-0.5**,没有混合效果

  红色在绿色前面，且红色**后渲染**，所以不会混合

  ![](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202307302311398.png)
