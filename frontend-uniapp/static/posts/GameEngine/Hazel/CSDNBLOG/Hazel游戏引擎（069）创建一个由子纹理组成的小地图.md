> 文中若有代码、术语等错误，欢迎指正

[toc]

# 前言

- 此节目的

  Cherno这节想用由068节搞得子纹理来创建一个**2D平面地图**

- 地图数据存储与读取

  Cherno提供了几种思路

  - 可以从文件读取地图

  - 也可以直接写死在程序里

    这里他为了方便就直接写死在文件中了。

  对于哪个**字符**对应哪个**子纹理**，采用的是map数据结构

# 关键代码

- 地图数据

  ```cpp
  // 用以前的炸弹人的地图
  /*
  0不绘制
  1是墙壁
  2是草地
  3是箱子
  */
  static const uint32_t s_MapWidth = 20;
  static const char* s_MapTiles =
  "00000000000000000000"
  "01111111111111111100"
  "01222312332312323100"
  "01213111121111213100"
  "01212222222222212100"
  "01211211121112113100"
  "01213233333332213100"
  "01331212313212133100"
  "01111232111232311100"
  "01113212313212132100"
  "01311233333332112100"
  "01321212121312333100"
  "01313211121112113100"
  "01311222222222212100"
  "01211131121111312100"
  "01213131121111212100"
  "01223333233333322100"
  "01111111111111111100"
  "00000000000000000000"
  "00000000000000000000"
  ;
  ```

- 实现字符串的**字符**对应的**子纹理**

  ```cpp
  std::unordered_map<char, Hazel::Ref<Hazel::SubTexture2D>> s_TextureMap;// map数据结构
  .......
  s_TextureMap['1'] = Hazel::SubTexture2D::CreateFromCoords(m_SpriteSheet, { 10, 8 }, { 128, 128 });
  s_TextureMap['2'] = Hazel::SubTexture2D::CreateFromCoords(m_SpriteSheet, { 1, 11 }, { 128, 128 });
  s_TextureMap['3'] = Hazel::SubTexture2D::CreateFromCoords(m_SpriteSheet, { 11, 11 }, { 128, 128 });
  ```

- for循环地图，将从map中获取对应的子纹理、根据xy确定位置给2D渲染类函数并上传到OpenGL着色器渲染

  ```cpp
  for (uint32_t y = 0; y < m_MapHeight; y++) {
      for (uint32_t x = 0; x < m_MapWidth; x++) {
          // x + y * m_MapWidth; 切割成2维数组
          char titleType = s_MapTiles[x + y * m_MapWidth];
          if (titleType == '0') { // 0的东西不画
              continue;
          }
          Hazel::Ref<Hazel::SubTexture2D> texture;
          if (s_TextureMap.find(titleType) != s_TextureMap.end()) {
              texture = s_TextureMap[titleType];
          }
          else {
              texture = m_TextureBush;
          }
          Hazel::Renderer2D::DrawQuad({x - m_MapWidth / 2.0f, m_MapHeight / 2.0f - y, 0.5f},{1.0f, 1.0f}, texture); // x - m_MapWidth / 2.0f,  y - m_MapHeight / 2.0f // 会导致y轴相反绘画
      }
  }
  ```


# Y轴相反Bug分析和效果图

- 绘制的地图与地图值Y轴相反效果图

  ![](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202307302306270.png)

- Bug分析

  - 每个Quad占1x1的面积

  - 如上的for循环注释代码，设地图字符串为20x20

    如果是**x - m_MapWidth / 2.0f,  y - m_MapHeight / 2.0f**传给2D渲染类函数

    可以使每个x，y对应一个位置，如下:

    ![](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202307302306272.png)

    x=1，对应-9; y = 1，对应-9

    ![](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202307302306927.png)

    x=2，对应**-8**; y = 1，对应-9

    ![](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202307302306009.png)

    x=3，对应**-7**; y = 2，对应**-8**

  - 根据分析可得

    当起点x=0，y=0时，是从左<font color="red">**下**</font>角**(-10,-10)**开始的

    与字符串的第一个位置(0,0)想在左<font color="green">**上**</font>角(-10,10)点冲突

    所以会造成**y轴垂直相反**

- 如何解决，将对应位置计算代码改成

  ```cpp
  {x - m_MapWidth / 2.0f, m_MapHeight / 2.0f - y , 0.5f}
  ```

  当x=0，x - m_MapWidth / 2.0f -> **-10**

  当y=0,   m_MapHeight / 2.0f - y-> **10**

  这样，则会从点左**上**角(-10, 10)开始。

  ![](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202307302306551.png)

- 效果图原型

  ![](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202307302316429.png)

  欢迎来观看我2019年写的炸弹人游戏视频，我[bilibili空间](https://www.bilibili.com/video/BV1Fx411R7yq)还挺大的：

