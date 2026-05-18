> 文中若有代码、术语等错误，欢迎指正

[toc]

# 前言

- 此节目的

  点击实体，在属性面板显示实体的**Transform组件**的位置、缩放、旋转属性。

  对UI有要求

  1. 文字需在**左边**，属性按钮在右边
  2. x不是label，而是按钮且带有颜色，且点击按钮可以复原值。

- 如何实现

  照样087那样，点击实体，检测是否有Transform组件，再将值传入ImGUi上绘制

# 代码

- Components.h

  ```cpp
  struct TransformComponent { // 不用继承Component
      glm::vec3 Translation = { 0.0f, 0.0f, 0.0f };
      glm::vec3 Rotation = { 0.0f, 0.0f,0.0f };
      glm::vec3 Scale = { 1.0f, 1.0f, 1.0f };
      TransformComponent() = default;
      TransformComponent(const TransformComponent&) = default; // 复制构造函数
      TransformComponent(const glm::vec3& translation)          // 转换构造函数
          : Translation(translation) {}
      glm::mat4 GetTransform()const {
          glm::mat4 rotation = glm::rotate(glm::mat4(1.0f), Rotation.x, { 1,0,0 })
              * glm::rotate(glm::mat4(1.0f), Rotation.y, { 0, 1, 0 })
              * glm::rotate(glm::mat4(1.0f), Rotation.z, { 0, 0, 1 });
  
          return glm::translate(glm::mat4(1.0f), Translation)
              * rotation
              * glm::scale(glm::mat4(1.0f), Scale);
      }
  };
  ```

- SceneHierarchyPanel.cpp

  ```cpp
  static void DrawVec3Control(const std::string& label, glm::vec3& values, float resetValue = 0.0f, float columnWidth = 100.0f) {
      // ImGUi push多少 要pop多少，不然会报错
      ImGui::PushID(label.c_str()); // 每一行用label做ID，3行ID不同互不干扰
  
      // 设置一行两列
      ImGui::Columns(2);
      // 第一列
      ImGui::SetColumnWidth(0, columnWidth);// 设置第1列宽100
      ImGui::Text(label.c_str());
      ImGui::NextColumn();		
  
      // 第二列
      // 放入3个item的宽
      ImGui::PushMultiItemsWidths(3, ImGui::CalcItemWidth());
      ImGui::PushStyleVar(ImGuiStyleVar_ItemSpacing, ImVec2{ 0,0 });
  
      float lineHeight = GImGui->Font->FontSize + GImGui->Style.FramePadding.y * 2.0f;// 设置行高
      ImVec2 buttonSize = { lineHeight + 3.0f, lineHeight };// 按钮大小
  
      ImGui::PushStyleColor(ImGuiCol_Button, ImVec4{ 0.8f, 0.1f, 0.15f, 1.0f });
      ImGui::PushStyleColor(ImGuiCol_ButtonHovered, ImVec4{ 0.9f, 0.2f, 0.2f, 1.0f });
      ImGui::PushStyleColor(ImGuiCol_ButtonActive, ImVec4{ 0.8f, 0.1f, 0.15f, 1.0f });
      if (ImGui::Button("X", buttonSize) ){
          values.x = resetValue;
      }
      ImGui::PopStyleColor(3);
  
      // 因为DragFloat button会换行，所以设置SameLine将不换行
      ImGui::SameLine();
      // ##X将分配一个id，且##x不会在UI界面显示出来。
      // #X 将显示在文本框的右边
      // X  将与上面的BUtton同名 同id，操作的话会报错
      ImGui::DragFloat("##X", &values.x, 0.1f, 0.0f, 0.0f, "%.2f");
      ImGui::PopItemWidth();
  
      ImGui::SameLine();
      ImGui::PushStyleColor(ImGuiCol_Button, ImVec4{ 0.2f, 0.7f, 0.2f, 1.0f });
      ImGui::PushStyleColor(ImGuiCol_ButtonHovered, ImVec4{ 0.3f, 0.8f, 0.3f, 1.0f });
      ImGui::PushStyleColor(ImGuiCol_ButtonActive, ImVec4{ 0.2f, 0.7f, 0.2f, 1.0f });
      if (ImGui::Button("Y", buttonSize)) {
          values.y = resetValue;
      }
      ImGui::PopStyleColor(3);
  
      ImGui::SameLine();
      ImGui::DragFloat("##Y", &values.y, 0.1f, 0.0f, 0.0f, "%.2f");// 0.1速度，0 - 0 最小最大无限制
      ImGui::PopItemWidth();
  
      ImGui::SameLine();
      ImGui::PushStyleColor(ImGuiCol_Button, ImVec4{ 0.1f, 0.25f, 0.8f, 1.0f });
      ImGui::PushStyleColor(ImGuiCol_ButtonHovered, ImVec4{ 0.2f, 0.35f, 0.9f, 1.0f });
      ImGui::PushStyleColor(ImGuiCol_ButtonActive, ImVec4{ 0.1f, 0.25f, 0.8f, 1.0f });
      if (ImGui::Button("Z", buttonSize)) {
          values.z = resetValue;
      }
      ImGui::PopStyleColor(3);
  
      ImGui::SameLine();
      ImGui::DragFloat("##Z", &values.z, 0.1f, 0.0f, 0.0f, "%.2f");
      ImGui::PopItemWidth();
  
      ImGui::PopStyleVar();
  
      // 恢复成一行一列
      ImGui::Columns(1);
  
      ImGui::PopID();
  }
  
  // 实体transform组件
  void SceneHierarchyPanel::DrawComponents(Entity entity)
  {
      ...
      // 实体transform组件
      if (entity.HasComponent<TransformComponent>()) {
          if (ImGui::TreeNodeEx((void*)typeid(TransformComponent).hash_code(), ImGuiTreeNodeFlags_DefaultOpen, "Transform")) {
              auto& tfc = entity.GetComponent<TransformComponent>();
              DrawVec3Control("Translation", tfc.Translation);
              glm::vec3 rotation = glm::degrees(tfc.Rotation);
              DrawVec3Control("Rotation", rotation); // 界面显示角度
              tfc.Rotation = glm::radians(rotation);
              DrawVec3Control("Scale", tfc.Scale, 1.0f);
  
              // 展开树节点
              ImGui::TreePop();
          }
      }
  }
  ```

# 关键代码

- ImGui

  - 水平放置

    ```cpp
    // 因为DragFloat button会换行，所以设置SameLine将不换行
    ImGui::SameLine();
    ```

  - ##X

    ```cpp
    // ##X将分配一个id，且##x不会在UI界面显示出来。
    // #X 将显示在文本框的右边
    // X  将与上面的BUtton同名 同id，操作的话会报错
    ImGui::DragFloat("##X", &values.x, 0.1f, 0.0f, 0.0f, "%.2f");
    ImGui::PopItemWidth();
    ```

  - 颜色按钮

    ```cpp
    ImGui::PushStyleColor(ImGuiCol_Button, ImVec4{ 0.8f, 0.1f, 0.15f, 1.0f });
    ImGui::PushStyleColor(ImGuiCol_ButtonHovered, ImVec4{ 0.9f, 0.2f, 0.2f, 1.0f });
    ImGui::PushStyleColor(ImGuiCol_ButtonActive, ImVec4{ 0.8f, 0.1f, 0.15f, 1.0f });
    if (ImGui::Button("X", buttonSize) ){
        values.x = resetValue;
    }
    ImGui::PopStyleColor(3);
    ```

- 变换矩阵拆分3个vec3如何组合成Transform变换矩阵

  ```cpp
  glm::vec3 Translation = { 0.0f, 0.0f, 0.0f };
  glm::vec3 Rotation = { 0.0f, 0.0f,0.0f };
  glm::vec3 Scale = { 1.0f, 1.0f, 1.0f };
  glm::mat4 GetTransform()const {
      glm::mat4 rotation = glm::rotate(glm::mat4(1.0f), Rotation.x, { 1,0,0 })
          * glm::rotate(glm::mat4(1.0f), Rotation.y, { 0, 1, 0 })
          * glm::rotate(glm::mat4(1.0f), Rotation.z, { 0, 0, 1 });
  
      return glm::translate(glm::mat4(1.0f), Translation)
          * rotation
          * glm::scale(glm::mat4(1.0f), Scale);
  }
  ```

# 效果

![](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202307302312552.png)





