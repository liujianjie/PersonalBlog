> 文中若有代码、术语等错误，欢迎指正

[toc]

# 前言

- 此节目的

  写出像Unity点击Cube，会显示一个**Inspector**面板，上面显示Cube的所有组件：transform、Mesh等。

- 实现思路

  在上一节SceneHierarchyPanel类的基础上，根据保存当前点击的哪个实体，传入这个实体的组件值进ImGUI的UI上。

# 代码流程

- 如果当前点击的实体有效

  ```cpp
  void SceneHierarchyPanel::OnImGuiRender()
  {
      ImGui::Begin("Scene Hierarchy");
      m_Context->m_Registry.each([&](auto entityID){
          Entity entity{entityID, m_Context.get()};
          DrawEntityNode(entity);
      });
      // 优化：若当前在hierarchy面板并且没点击到实体，属性面板清空
      if (ImGui::IsMouseDown(0) && ImGui::IsWindowHovered()) {
          m_SelectionContext = {};
      }
      ImGui::End();
      //////////////////////////////////////////////////////////////////////
      // 新添加一个ImGui面板
      // 判断当前点击的实体是否存在
      ImGui::Begin("Properties");
      if (m_SelectionContext) { // operator uint32_t() 的是const，不然不会调用operator bool(),而是调用uint32_t()
          DrawComponents(m_SelectionContext);
      }
      ImGui::End();
  }
  void SceneHierarchyPanel::DrawEntityNode(Entity entity)
  {
      // 要引入 Log头文件
      auto& tag = entity.GetComponent<TagComponent>().Tag;
      // 若是被点击标记为选中状态|有下一级
      ImGuiTreeNodeFlags flags = ((m_SelectionContext == entity) ? ImGuiTreeNodeFlags_Selected : 0) | ImGuiTreeNodeFlags_OpenOnArrow;
      // 第一个参数是唯一ID 64的，
      bool opened = ImGui::TreeNodeEx((void*)(uint64_t)(uint32_t)entity, flags, tag.c_str());
      if (ImGui::IsItemClicked()) {
          ////////////////////////////////////////////////////////////////
          m_SelectionContext = entity; // 记录当前点击的实体
      }
      if (opened) {
          ImGuiTreeNodeFlags flags = ImGuiTreeNodeFlags_OpenOnArrow;
          bool opened = ImGui::TreeNodeEx((void*)98476565, flags, tag.c_str());
          if (opened) {
              ImGui::TreePop();
          }
          ImGui::TreePop();
      }
  }
  ```

- 显示这个实体的Tag与Transform组件里的属性

  ```cpp
  void SceneHierarchyPanel::DrawComponents(Entity entity)
  {
      // 实体名称
      if (entity.HasComponent<TagComponent>()) {
          auto& tag = entity.GetComponent<TagComponent>().Tag;
  
          // 一个字符缓冲区，限制了大小，以免太长
          char buffer[256];
          memset(buffer, 0, sizeof(buffer));
  
          strcpy(buffer, tag.c_str());
          if (ImGui::InputText("Tag", buffer, sizeof(buffer))) {
              tag = std::string(buffer);
          }
      }
      // 实体transform组件
      if (entity.HasComponent<TransformComponent>()) {
          if (ImGui::TreeNodeEx((void*)typeid(TransformComponent).hash_code(), ImGuiTreeNodeFlags_DefaultOpen, "Transform")) {
              auto& transform = entity.GetComponent<TransformComponent>().Transform;
              ImGui::DragFloat3("Position", glm::value_ptr(transform[3]), 0.1f);// 0.1f是拖动文本框的步幅
              // 展开树节点
              ImGui::TreePop();
          }
      }
  }
  ```

# 效果

![](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202307302311147.png)

# 记录Bug

- 问题说明

  未选择任何物体，m_SelectionContext还是**返回true**能进入条件块内。

- 问题所在

  Entity重载的运算符

  ```cpp
  operator bool() const { 
      return m_EntityHandle != entt::null; 
  }
  operator uint32_t() { 
      return (uint32_t)m_EntityHandle; 
  }
  ```

- 一开始怀疑

  m_SelectionContext的m_EntityHandle没有赋值为**null**，以为entt::null = 0，后面debug才知道entt::null的值**不是0**

  ![](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202307302311752.png)

- 再debug跟踪

  发现if(m_SelectionContext)不会执行operator bool()，**而是执行operator uint32_t()**，从而返回一个4294967295这个数大于0，自热而然会进入条件块内。

  给operator uint32_t() 变为**operator uint32_t() const** 时才会执行operator bool()函数。

