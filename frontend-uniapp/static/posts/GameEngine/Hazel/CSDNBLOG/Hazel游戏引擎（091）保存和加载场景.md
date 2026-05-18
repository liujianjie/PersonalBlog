> 文中若有代码、术语等错误，欢迎指正

[toc]

# 前言

- 目的

  如此节标题，为了实现像unity那样**保存场景到本地**和**从本地加载场景**的功能

- 原理

  这功能其实就是将场景的实体和组件用**文本信息**保存起来，加载场景的话就是**读取文本信息**，根据文本存储的信息，**创建实体**并且**设置组件和组件数据**。

- 用什么存储和解析技术实现

  用yaml存储和解析yaml。使用第三方库yaml，将为其写premake文件融入到项目中，使用这个库的存储和解析功能。

  [地址](https://github.com/TheCherno/yaml-cpp)

- 为什么不用其它格式存储

  - 二进制

    虽然有保护性，但是**阅读困难**对引擎开发人员来说

  - Json

    Cherno说它的格式{}，会漏掉{}括号，**维护有点麻烦**。

# 将yaml项目作为子模块融入项目中

1. cmd

   ```cpp
   git submodule add https://github.com/TheCherno/yaml-cpp GameEngineLightWeight/vendor/yaml-cpp
   ```

2. 打开yaml-cpp文件夹下的premake.lua，将staticruntime "off"改为

   ```cpp
   staticruntime "on"
   ```

   目的是使yaml-cpp项目作为**静态链接**

3. 打开项目根目录的premake5.lua,修改的和增加的地方如下：

   ```cpp
   IncludeDir["yaml_cpp"] = "GameEngineLightWeight/vendor/yaml-cpp/include" -- 用yaml_cpp下划线是因为"%{IncludeDir.yaml_cpp}"只认识_ 不认识-
   
   group "Dependencies"
   	include "GameEngineLightWeight/vendor/GLFW"
   	include "GameEngineLightWeight/vendor/Glad"
   	include "GameEngineLightWeight/vendor/imgui"
   	include "GameEngineLightWeight/vendor/yaml-cpp"
   group ""
   
   includedirs{
       "%{prj.name}/src",
       "%{prj.name}/vendor/spdlog/include",
       "%{IncludeDir.Glad}",
       "%{IncludeDir.GLFW}",
       "%{IncludeDir.ImGui}",
       "%{IncludeDir.glm}",
       "%{IncludeDir.stb_image}",
       "%{IncludeDir.entt}",
       "%{IncludeDir.yaml_cpp}"
   }
   	
   links{
       "GLFW",
       "Glad",
       "ImGui",
       "yaml-cpp",
       "opengl32.lib"
   }
   ```

4. 重新运行脚本生成新项目

# 关键的代码

- 存储

  ```cpp
  void SceneSerializer::Serialize(const std::string& filepath)
  {
      YAML::Emitter out;
      out << YAML::BeginMap;
  
      out << YAML::Key << "Scene" << YAML::Value << "Untitled";
      out << YAML::Key << "Entities" << YAML::Value << YAML::BeginSeq;// 开始序列化
      m_Scene->m_Registry.each([&](auto entityID) {
          Entity entity = { entityID ,m_Scene.get() };
          if (!entity)
              return;
          // 序列化实体
          SerializeEntity(out, entity);
      });
      out << YAML::EndSeq; // 结束序列化
  
      out << YAML::EndMap;
  
      std::ofstream fout(filepath);
      fout << out.c_str();
  }
  static void SerializeEntity(YAML::Emitter& out, Entity entity) {
      out << YAML::BeginMap;
      out << YAML::Key << "Entity" << YAML::Value << "12837192831273";
      if (entity.HasComponent<TagComponent>()) {
          out << YAML::Key << "TagComponent";
          out << YAML::BeginMap;
  
          auto& tag = entity.GetComponent<TagComponent>().Tag;
          out << YAML::Key << "Tag" << YAML::Value << tag;
  
          out << YAML::EndMap;
      }
      // 其它组件类似
      out << YAML::EndMap;
  }
  ```

- 解析

  ```cpp
  std::ifstream stream(filepath);
  std::stringstream strStream;
  strStream << stream.rdbuf(); // strStream流对象中的流重定向到字符串输出流strStream
  
  // 转换为node对象
  YAML::Node data = YAML::Load(strStream.str());
  if (!data["Scene"]) {
      return false;
  }
  
  std::string sceneName = data["Scene"].as<std::string>();
  HZ_CORE_TRACE("Deserializing scene '{0}'", sceneName);
  
  auto entities = data["Entities"];
  if (entities) {
      for (auto entity : entities) {
          uint64_t uuid = entity["Entity"].as<uint64_t>();
  
          std::string name;
          auto tagComponent = entity["TagComponent"];
          if (tagComponent) {
              name = tagComponent["Tag"].as<std::string>();
          }
          HZ_CORE_TRACE("Deserialized entity with ID = {0}, name = {1}", uuid, name);
  
          Entity deserializedEntity = m_Scene->CreateEntity(name);;
  
          auto transformComponent = entity["TransformComponent"];
          if (transformComponent) {
              // 添加实体，默认有transform组件
              auto& tc = deserializedEntity.GetComponent<TransformComponent>();
              tc.Translation = transformComponent["Translation"].as<glm::vec3>();
              tc.Rotation = transformComponent["Rotation"].as<glm::vec3>();
              tc.Scale = transformComponent["Scale"].as<glm::vec3>();
          }
          .....
              
  ```

- 存储的文件

  ```cpp
  Scene: Untitled
  Entities:
    - Entity: 12837192831273
      TagComponent:
        Tag: Camera B
    - Entity: 12837192831273
      TagComponent:
        Tag: Camera A
    ......
  ```

# 关于yaml的BeginSeq

开了<< YAML::BeginSeq

```cpp
Scene: Untitled
Entities:
  - Entity: 12837192831273
    TagComponent:
      Tag: Camera B
  - Entity: 12837192831273
    TagComponent:
      Tag: Camera A
  - Entity: 12837192831273
    TagComponent:
      Tag: Green Square Entity
  - Entity: 12837192831273
    TagComponent:
      Tag: Red Square Entity
```

没开<< YAML::BeginSeq

```cpp
Scene: Untitled
Entities:
  Entity: 12837192831273
  TagComponent:
    Tag: Camera B
? Entity: 12837192831273
  TagComponent:
    Tag: Camera A
: Entity: 12837192831273
  TagComponent:
    Tag: Green Square Entity
? Entity: 12837192831273
  TagComponent:
    Tag: Red Square Entity
```

可以看出，BeginSeq是在实体信息前加一个**“-”**，代表着是一个实例

# 记录bug

- 问题详情

  error LNK2038: 检测到“RuntimeLibrary”的不匹配项: 值“MDd_DynamicDebug”不匹配值“MTd_StaticDebug”(EditorLayer.obj 中)

- 解决方法

  将yaml-cpp项目的运行库改为MTD;

  ![](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202307302312336.png)

- 为什么有这个bug

  因为在yaml-cpp项目的premake5.lua

  ```cpp
  filter "system:windows"
      systemversion "latest"
      cppdialect "cpp17"
      staticruntime "off"
  ```

   staticruntime "off",代表不是静态链接，所以生成了动态链接dll的选项**MDd**

  要修改成

  ```cpp
  filter "system:windows"
      systemversion "latest"
      cppdialect "cpp17"
      staticruntime "on"
  ```

  才是静态链接
