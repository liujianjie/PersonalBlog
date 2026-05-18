> 文中若有代码、术语等错误，欢迎指正

[toc]

# 前言

- 前前言

  Cherno改变视频方式，就是用**直播方式**来做接下来的视频，而不是先在直播前想好写好，再录制另一个视频用来Copy和解释直播写的代码。

- 此节目的

  为了实现quad有纹理，要实现像Unity那样**拖动**纹理的文件 到 实体的组件下就能生成纹理组件。

  此节为完成此目的，需先完成显示本地assets文件夹下的文件夹和文件。

- 如何实现

  1. 用ImGUI渲染

  2. 由C++的fstream检索处理的文件和文件夹。

- 参考C++的fstreamAPI网站

  https://en.cppreference.com/w/cpp/filesystem

# 代码

```cpp
void ContentBrowserPanel::OnImGuiRender()
{
    ImGui::Begin("Content Browser");
    // 为了返回上一级目录
    // 1.当前目录！= assets目录
    if (m_CurrentDirectory != std::filesystem::path(s_AssetPath)) {
        // 2.如果点击了按钮
        if (ImGui::Button("<-")) {
            // 3.当前目录 = 当前目录的父目录
            m_CurrentDirectory = m_CurrentDirectory.parent_path();
        }
    }
    // 为了遍历当前目录下的文件和文件夹
    for (auto& directoryEntry : std::filesystem::directory_iterator(m_CurrentDirectory)) {
        // 1.得到子文件夹或文件path类。					比如：path = assets\cache\shader
        const auto& path = directoryEntry.path();
        // 2.得到子文件与的assets文件夹的相对位置path。	relativePath = cache\shader
        auto relativePath = std::filesystem::relative(path, s_AssetPath);
        // 3.获取子文件的文件名。						filenameString = shader
        std::string filenameString = relativePath.filename().string();
        // 4.1如果子文件是目录，设置按钮，点进去更新当前目录
        if (directoryEntry.is_directory()) {
            if (ImGui::Button(filenameString.c_str())) {
                m_CurrentDirectory /= path.filename();
            }
        }else{
            // 4.2如果子文件是文件，设置按钮，点进去打开
            if (ImGui::Button(filenameString.c_str())) {
            }
        }
    }
    ImGui::End();
}
```

# 效果

![](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202308132110523.png)

# 小点

- filename与Stem区别

  文件名：test.txt

  ```c++
  const std::filesystem::path testPath = "test.txt";
  
  std::string path = testPath.string();
  auto p0 = testPath.filename().string();
  auto p1 = testPath.stem().string();
  ImGui::Text("filename: %s", p0.c_str()); // test.txt
  ImGui::Text("Stem: %s", p1.c_str());	// test  
  ```

  stem不带后缀，filename带后缀

  ![](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202308122243340.png)

# 优化

由于内容面板是每一帧在绘制，性能有失

- 可以考虑1秒更新
- 可以将目录存在list中，这样不用每次都读磁盘，而是读cpu，但目录文件内容改变时如何更新list是个问题。