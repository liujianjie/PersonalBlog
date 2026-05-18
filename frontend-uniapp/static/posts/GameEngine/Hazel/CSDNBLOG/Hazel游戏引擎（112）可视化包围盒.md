> 文中若有代码、术语等错误，欢迎指正

[toc]

# 前言

- 此节目的

  实现一个复选框点击后，场景可以**渲染出图形相应的包围盒**

- 如何实现

  使用上两节加的渲染**Line**和**Rect**来渲染盒状包围盒。

  至于圆的包围盒，一样绘制圆，只不过控制**厚度**，从而实现**圆环**形状=圆包围盒

- 实现细节

  - 渲染包围盒的代码应放在哪？

    **应放在编辑层，而不是场景层。**

    - 场景层是渲染场景内的物体的，而至于包围盒不属于场景，若放在场景里，需要向编辑层获取是否显示包围盒的控制， 这样会导致紊乱。

    - 放在**编辑层**，等渲染物体后再渲染包围盒，这使得物体与调试相关的渲染分开，更好扩展。

  - 重点

    包围盒需跟随对应的物体，所以包围盒的transform如何正确是个重点，需**基于物体**的平移、旋转、缩放。

# 代码

```cpp
void EditorLayer::OnOverlayRender()
{	// 两个不同摄像机
    if (m_SceneState == SceneState::Play) {
        Entity camera = m_ActiveScene->GetPrimaryCameraEntity();
        // Caemra类没有视图矩阵，所以需传入transform计算视图矩阵
        Renderer2D::BeginScene(camera.GetComponent<CameraComponent>().camera, camera.GetComponent<TransformComponent>().GetTransform());
    }
    else {
        // EditorCamera，可以直接获取投影视图矩阵，所以不需要transform
        Renderer2D::BeginScene(m_EditorCamera);
    }
    if (m_ShowPhysicsColliders) {// 由复选框控制
        ////////////////////////////////////////////////////////////////////////////////////
        // 重点/////////////////////////////////////////////////////////////////////////////
        // 包围盒需跟随对应的物体,包围盒的transform需基于物体的平移、旋转、缩放。
        // Box Colliders
        {
            auto view = m_ActiveScene->GetAllEntitiesWith<TransformComponent, BoxCollider2DComponent>();
            for (auto entity : view) {
                auto [tc, bc2d] = view.get<TransformComponent, BoxCollider2DComponent>(entity);
                // 0.001fZ轴偏移量
                glm::vec3 translation = tc.Translation + glm::vec3(bc2d.Offset, 0.001f);
                glm::vec3 scale = tc.Scale * glm::vec3(bc2d.Size * 2.0f, 1.0f); // 注意bc2d.Size需乘以2，以免缩小一半

                // Cherno的代码，只绕着Z轴旋转 rotation的z值
                //glm::mat4 transform = glm::translate(glm::mat4(1.0f), translation)
                //	* glm::rotate(glm::mat4(1.0f), tc.Rotation.z, glm::vec3(0.0f, 0.0f, 1.0f))// 围绕z旋转的角度
                //	* glm::scale(glm::mat4(1.0f), scale);

                // 应改成：跟随物体的旋转角度而旋转
                // 第一种rotation计算方式，有bug，旋转相反，待解决
                //glm::mat4 rotation = glm::rotate(glm::mat4(1.0f), tc.Rotation.x, { 1,0,0 })
                //    * glm::rotate(glm::mat4(1.0f), tc.Rotation.y, { 0, 1, 0 })
                //    * glm::rotate(glm::mat4(1.0f), tc.Rotation.z, { 0, 0, 1 });
                
                // 第二种rotation计算方式 用四元数获得矩阵
                glm::mat4 rotation = glm::toMat4(glm::quat(tc.Rotation));

                glm::mat4 transform = glm::translate(glm::mat4(1.0f), translation)
                    * rotation
                    * glm::scale(glm::mat4(1.0f), scale);

                Renderer2D::DrawRect(transform, glm::vec4(0, 1, 0, 1));// 绿色的包围盒
            }
        }
        // Circle Colliders
        {
            auto view = m_ActiveScene->GetAllEntitiesWith<TransformComponent, CircleCollider2DComponent>();
            for (auto entity : view) {
                auto [tc, cc2d] = view.get<TransformComponent, CircleCollider2DComponent>(entity);
                // 0.001fZ轴偏移量
                glm::vec3 translation = tc.Translation + glm::vec3(cc2d.Offset, 0.001f);
                glm::vec3 scale = tc.Scale * glm::vec3(cc2d.Radius * 2);// 注意cc2d.Radius需乘以2，以免缩小一半
                
                // 错误写法
                //glm::mat4 transform = glm::translate(glm::mat4(1.0f), translation)
                //    * glm::scale(glm::mat4(1.0f), scale);
                
                // 第二种rotation计算方式 用四元数获得矩阵
                glm::mat4 rotation = glm::toMat4(glm::quat(tc.Rotation));// 新增的///////////////////

                glm::mat4 transform = glm::translate(glm::mat4(1.0f), translation)
                    * rotation// 新增的///////////////////
                    * glm::scale(glm::mat4(1.0f), scale);

                Renderer2D::DrawCircle(transform, glm::vec4(0, 1, 0, 1), 0.01f);//绿色的包围盒, 第三个参数控制呈现圆环
            }
        }
    }
    Renderer2D::EndScene();
}
```

在EditorLayer的Update函数中，并在渲染完场景的物体后，再调用OnOverlayRender函数

# 关于摄像机移到物体后面效果

![](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202308132151874.png)

- 引入

  ```cpp
  // 0.001fZ轴偏移量，设置盒子的位置在物体的前面一点点
  glm::vec3 translation = tc.Translation + glm::vec3(bc2d.Offset, 0.001f);
  ```

  ![](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202308132152946.png)

  可见正对物体时，包围盒在物体的**前面**。

- 当摄像机移到物体后面时

  ![](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202308132151402.png)

  可以发现有个小BUG，Quad物体的绿色包围盒依旧能看到，但是Circle的包围盒却看不到了。

  Cherno说可以根据摄像机的位置决定圆的包围盒画在物体的**前方**还是**后方**即可解决此问题。

  我自己理解的一些（可能有错）：

  - Quad的包围盒能看见

    - Quad的**包围盒**z轴依旧**大于**Quad，当前摄像机并没有处在z轴位置看物体，自然能投影看到包围盒
    - Quad的**包围盒**是用**DrawLine**画线画的，而Quad本身是用三角形索引画的，两个draw不一样

  - Circle的包围盒看不见——待解决

    只能提出下面几点

    - Circle的**包围盒**是用同画圆的方式画的，Circle本身也是用画圆的方式画的
    - Circle的**包围盒**是用thickness控制**边缘**能有颜色，其它部分alpha为0
    - 有可能的是Circle的glsl导致的

    ![](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202308132151806.png)

    ![](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202308132151454.png)

    即使圆物体**本身边缘**的**alpha为0**，圆包围盒依旧看不清，应该是glsl的问题吧？

# 我发现的Bug

## Bug1.1：Quad设置旋转角度后，包围盒不跟随Quad

- 错误写法1：包围盒的transform矩阵

  ```cpp
  // Cherno的代码，只绕着Z轴旋转 rotation的z值
  glm::mat4 transform = glm::translate(glm::mat4(1.0f), translation)
      * glm::rotate(glm::mat4(1.0f), tc.Rotation.z, glm::vec3(0.0f, 0.0f, 1.0f))// 围绕z旋转的角度
      * glm::scale(glm::mat4(1.0f), scale);
  ```

  当修改Quad的x、y、z旋转角度后，包围盒的位置是不正确的，如下：

  ![image-20230809221952678](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202308132151649.png)

- 有点小Bug的写法2：包围盒的transform矩阵

  包围盒的旋转角度应该考虑到Quad的x、y、z3个角度值

  ```cpp
  // 应改成：跟随物体的旋转角度而旋转
  // 第一种rotation计算方式，有bug，旋转相反，待解决
  glm::mat4 rotation = glm::rotate(glm::mat4(1.0f), tc.Rotation.x, { 1,0,0 })
      * glm::rotate(glm::mat4(1.0f), tc.Rotation.y, { 0, 1, 0 })
      * glm::rotate(glm::mat4(1.0f), tc.Rotation.z, { 0, 0, 1 });
  
  glm::mat4 transform = glm::translate(glm::mat4(1.0f), translation)
      * rotation
      * glm::scale(glm::mat4(1.0f), scale);
  ```

  此写法有点小Bug，包围盒的位置与Quad的位置相反

  ![image-20230809222340312](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202308132152746.png)

- 正确写法

  ```cpp
  //第二种rotation计算方式 用四元数获得矩阵
  glm::mat4 rotation = glm::toMat4(glm::quat(tc.Rotation));
  
  glm::mat4 transform = glm::translate(glm::mat4(1.0f), translation)
      * rotation
      * glm::scale(glm::mat4(1.0f), scale);
  ```

  这样写，包围盒才会与Quad的旋转角度位置一致

  ![image-20230809222635532](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202308132151850.png)

## Bug1.2：盒型包围盒设置Offset后，包围盒物理计算错误

- Bug解释

  当设置Quad包围盒的**offset**后运行

  发现偏移位置的Box包围的**不参与**物理计算，参与物理计算的**还是Quad本身顶点位置**

  ![](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202308132151154.png)

- 当时不知道解决方法，**猜测**是Box2D设置包围盒boxShape的地方没有加上偏移导致的

  ```cpp
  // 3.1定义Box包围盒
  b2PolygonShape boxShape;
  // TODO:待完善！
  boxShape.SetAsBox(bc2d.Size.x * transform.Scale.x, bc2d.Size.y * transform.Scale.y);// 包围盒跟随物体的size而变化
  ```

- 后续

  在HazelGitHUb上的[ISSUE](https://github.com/TheCherno/Hazel/pull/555)有人提出这个问题并且有 解决方法，并在117节Cherno有讲

  **是需要加上包围盒的偏移**

  ```cpp
  void Scene::OnPhysics2DStart(){
      // 错误写法
      //boxShape.SetAsBox(bc2d.Size.x * transform.Scale.x, bc2d.Size.y * transform.Scale.y);
      // 正确写法：加上了包围盒的偏移位置
      // 包围盒的计算范围跟随物体的size、偏移位置而变化
      boxShape.SetAsBox(bc2d.Size.x * transform.Scale.x, bc2d.Size.y * transform.Scale.y,
                        b2Vec2(bc2d.Offset.x, bc2d.Offset.y), 0);// 包括偏移
  ```

  ```cpp
  void EditorLayer::OnOverlayRender(){	
  for (auto entity : view) {
      auto [tc, bc2d] = view.get<TransformComponent, BoxCollider2DComponent>(entity);
      // 方法1：不行
      // 0.001fZ轴偏移量
      glm::vec3 translation = tc.Translation + glm::vec3(bc2d.Offset, 0.001f);
      glm::vec3 scale = tc.Scale * glm::vec3(bc2d.Size * 2.0f, 1.0f); // 注意bc2d.Size需乘以2，以免缩小一半
  	glm::mat4 rotation = glm::toMat4(glm::quat(tc.Rotation));
      // 若将偏移位置先和物体的位置相加后再与旋转相乘，会导致包围盒运算时的很奇怪，所以不正确!!!!
      //glm::mat4 transform = glm::translate(glm::mat4(1.0f), translation)
      //	* rotation
      //	* glm::scale(glm::mat4(1.0f), scale);
  	
      // 方法2：可以
      // 应该先物体的位置乘以旋转再乘偏移量才正确
      glm::mat4 transform = glm::translate(glm::mat4(1.0f), tc.Translation)// tc.Translation != translation
          * rotation
          * glm::translate(glm::mat4(1.0f), glm::vec3(bc2d.Offset, 0.001f))// 包围盒的位置还需要算上偏移位置
          * glm::scale(glm::mat4(1.0f), scale);
  
      Renderer2D::DrawRect(transform, glm::vec4(0, 1, 0, 1));// 绿色的包围盒
  }
  ```

  - 效果奇怪写法：若将偏移位置**先**和物体的位置**相加**，**后**再与旋转**相乘**

    ```cpp
    glm::vec3 translation = tc.Translation + glm::vec3(bc2d.Offset, 0.001f);
    glm::vec3 scale = tc.Scale * glm::vec3(bc2d.Size * 2.0f, 1.0f); // 注意bc2d.Size需乘以2，以免缩小一半
    // 若将偏移位置先和物体的位置相加后再与旋转相乘，会导致包围盒运算时的很奇怪，所以不正确!!!!
    glm::mat4 rotation = glm::toMat4(glm::quat(tc.Rotation));
    
    glm::mat4 transform = glm::translate(glm::mat4(1.0f), translation)
        * rotation
        * glm::scale(glm::mat4(1.0f), scale);
    ```

    ![2.1偏移位置先相加再偏移](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202308132151858.gif)

    有围绕着一个点运动感觉

  - 效果正确写法：物体的位置**先乘以旋转**，再**乘偏移量**才正确

    ```cpp
    glm::vec3 translation = tc.Translation + glm::vec3(bc2d.Offset, 0.001f);
    glm::vec3 scale = tc.Scale * glm::vec3(bc2d.Size * 2.0f, 1.0f);
    glm::mat4 rotation = glm::toMat4(glm::quat(tc.Rotation));
    
    glm::mat4 transform = glm::translate(glm::mat4(1.0f), tc.Translation)// tc.Translation != translation
        * rotation
        * glm::translate(glm::mat4(1.0f), glm::vec3(bc2d.Offset, 0.001f))// 包围盒的位置还需要算上偏移位置
        * glm::scale(glm::mat4(1.0f), scale);
    ```

    ![2.2后偏移](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202308132151307.gif)

## Bug2.1：Circle设置旋转角度后，包围盒不跟随Circle

- Bug解释：和1.1差不多

  原始写法

  ```cpp
  // Circle Colliders
  {
      auto view = m_ActiveScene->GetAllEntitiesWith<TransformComponent, CircleCollider2DComponent>();
      for (auto entity : view) {
          auto [tc, cc2d] = view.get<TransformComponent, CircleCollider2DComponent>(entity);
  
          glm::vec3 translation = tc.Translation + glm::vec3(cc2d.Offset, 0.001f);
          glm::vec3 scale = tc.Scale * glm::vec3(cc2d.Radius * 2);// 注意：需*2
  
          glm::mat4 transform = glm::translate(glm::mat4(1.0f), translation)
              * glm::scale(glm::mat4(1.0f), scale);
  
          Renderer2D::DrawCircle(transform, glm::vec4(0, 1, 0, 1), 0.01f);// 绿色的包围盒, 第三个参数控制呈现圆环
      }
  }
  ```

  ![image-20230809230248661](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202308132151622.png)

- 正确写法

  ```cpp
  // Circle Colliders
  auto view = m_ActiveScene->GetAllEntitiesWith<TransformComponent, CircleCollider2DComponent>();
  for (auto entity : view) {
      auto [tc, cc2d] = view.get<TransformComponent, CircleCollider2DComponent>(entity);
      // 0.001fZ轴偏移量
      glm::vec3 translation = tc.Translation + glm::vec3(cc2d.Offset, 0.001f);
      glm::vec3 scale = tc.Scale * glm::vec3(cc2d.Radius * 2);// 注意cc2d.Radius需乘以2，以免缩小一半
      // 第二种rotation计算方式 用四元数获得矩阵
      glm::mat4 rotation = glm::toMat4(glm::quat(tc.Rotation));// 新增的///////////////////
  
      glm::mat4 transform = glm::translate(glm::mat4(1.0f), translation)
          * rotation// 新增的///////////////////
          * glm::scale(glm::mat4(1.0f), scale);
  
      Renderer2D::DrawCircle(transform, glm::vec4(0, 1, 0, 1), 0.01f);//绿色的包围盒, 第三个参数控制呈现圆环
  }
  ```

  ![image-20230809230504655](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202308132152290.png)

## Bug2.2：圆形包围盒设置Offset后，物理效果奇怪

- 解释Bug

  当圆形包围盒的**offset**设置后运行，发现

  1. 圆形包围盒的物理计算不正确
  2. 圆形包围盒能进**入障碍物的盒子包围盒**里面
  3. 圆形包围盒**运动奇怪**

  ![3.1圆形运动不正确](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202308132152122.gif)

- 尝试解决方法1

  经过测试**固定旋转**效果好一点，但是依旧不尽人意，因此固定Rotation不是个好方法

  ![3.2圆形运动正确](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202308132152283.gif)

- 尝试解决方法2

  **确定**Box2D设置圆形包围盒circleShape是如下代码

  ```cpp
  if (entity.HasComponent<CircleCollider2DComponent>()) {
      auto& cc2d = entity.GetComponent<CircleCollider2DComponent>();
      // 3.1定义圆形包围盒
      b2CircleShape circleShape;
      circleShape.m_p.Set(cc2d.Offset.x, cc2d.Offset.y); // 需要偏移位置！！！
      circleShape.m_radius = transform.Scale.x * cc2d.Radius;// 参与物理计算的范围跟随物体的scale变化
      // 3.2定义fixture，fixture包含定义的包围盒
      b2FixtureDef fixtureDef;
      fixtureDef.shape = &circleShape;
      fixtureDef.density = cc2d.Density;
      fixtureDef.friction = cc2d.Friction;
      fixtureDef.restitution = cc2d.Restitution;
      fixtureDef.restitutionThreshold = cc2d.RestitutionThreshold;
      // 3.3定义主体的fixture
      body->CreateFixture(&fixtureDef);
  }
  ```

  - 错误原因是同**Bug1.2**

    圆形包围盒的**transform矩阵计算错误**，导致物理模拟计算奇怪

  将圆形包围盒的transform矩阵改成如下

  ```cpp
  // Circle Colliders
  auto view = m_ActiveScene->GetAllEntitiesWith<TransformComponent, CircleCollider2DComponent>();
  for (auto entity : view) {
      auto [tc, cc2d] = view.get<TransformComponent, CircleCollider2DComponent>(entity);
      // 0.001fZ轴偏移量
      glm::vec3 translation = tc.Translation + glm::vec3(cc2d.Offset, 0.001f);
      glm::vec3 scale = tc.Scale * glm::vec3(cc2d.Radius * 2);// 注意cc2d.Radius需乘以2，以免缩小一半
      // 第二种rotation计算方式 用四元数获得矩阵
      glm::mat4 rotation = glm::toMat4(glm::quat(tc.Rotation));
  
      // 若将偏移位置先和物体的位置相加后再与旋转相乘，会导致包围盒的位置很奇怪，所以不正确
      //glm::mat4 transform = glm::translate(glm::mat4(1.0f), translation)
      //  * rotation
      //	* glm::scale(glm::mat4(1.0f), scale);
  
      glm::mat4 transform = glm::translate(glm::mat4(1.0f), tc.Translation)
          * rotation
          * glm::translate(glm::mat4(1.0f), glm::vec3(cc2d.Offset, 0.001f))// 包围盒的位置还需要算上偏移位置
          * glm::scale(glm::mat4(1.0f), scale);
  
      Renderer2D::DrawCircle(transform, glm::vec4(0, 1, 0, 1), 0.01f);// 绿色的包围盒, 第三个参数控制呈现圆环
  }
  ```

  ![3.2圆形运动正确-fix rotation](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202308132152730.gif)

# Cherno遇到的Bug

## Bug1：**Quad**的包围盒小了一半

但只是显示包围盒小了一半，实际物理运算时还是正常大小

- 解释Bug

  ![image-20230809232844483](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202308132152715.png)

- 原因

  因为计算包围盒transform的Scale的Size未乘2

  ```cpp
  glm::vec3 scale = tc.Scale * glm::vec3(bc2d.Size, 1.0f);
  ```

- 修改为

  ```cpp
  glm::vec3 scale = tc.Scale * glm::vec3(bc2d.Size*2, 1.0f);
  ```

- 详细说明Bug

  包围盒的Size为**0.5**，tc.Scale = 1, 代入计算得scale=0.5，即缩小了一半。

  而这调用的DrawRect传入的参数是Transform，这Transform会和圆实际为Quad的四个顶点相乘得出最终位置，即世界坐标，因transform矩阵的scale部分为0.5，从而顶点位置围成的Quad会缩小一半范围

  ```cpp
  Renderer2D::DrawRect(transform, glm::vec4(0, 1, 0, 1));// 绿色的包围盒
  void Renderer2D::DrawRect(const glm::mat4& transform, const glm::vec4& color, int entityID)
  {
      glm::vec3 lineVertices[4];
      for (size_t i = 0; i < 4; i++)
      {
          lineVertices[i] = transform * s_Data.QuadVertexPosition[i]; // quad的顶点位置正好是rect的顶点位置
      }
      DrawLine(lineVertices[0], lineVertices[1], color);
      DrawLine(lineVertices[1], lineVertices[2], color);
      DrawLine(lineVertices[2], lineVertices[3], color);
      DrawLine(lineVertices[3], lineVertices[0], color);
  }
  ```

- 为什么定义包围盒boxShape的Size是**0.5**

  ```cpp
  boxShape.SetAsBox(bc2d.Size.x * transform.Scale.x, bc2d.Size.y * transform.Scale.y,
                    b2Vec2(bc2d.Offset.x, bc2d.Offset.y), 0);
  ```

  **因为box2D自身的规定，Size为0.5，参与实际物理计算的是长宽为1大小的box**。

  - 提一下我们当前定义Quad的4个顶点的局部位置，xy是与中心点(0, 0)相差0.5，形成长宽为1的Quad。

    ```cpp
        // 设置quad的初始位置
        s_Data.QuadVertexPosition[0] = { -0.5f, -0.5f, 0.0f, 1.0f };
        s_Data.QuadVertexPosition[1] = {  0.5f, -0.5f, 0.0f, 1.0f };
        s_Data.QuadVertexPosition[2] = {  0.5f,  0.5f, 0.0f, 1.0f };
        s_Data.QuadVertexPosition[3] = { -0.5f,  0.5f, 0.0f, 1.0f };
        ......
        void Renderer2D::DrawQuad(const glm::mat4& transform, const glm::vec4& color, int entityID)
        {
            for (size_t i = 0; i < quadVertexCount; i++) {
                s_Data.QuadVertexBufferPtr->Position = transform * s_Data.QuadVertexPosition[i];
                ......
            }  
    ```

    这可以更好的理解为什么box2D规定**size0.5**代表**长宽1**的box盒子


## Bug2：**圆**的包围盒小了一半

但只是显示包围盒小了一半，实际物理运算时还是正常大小

- 解释bug

  ![](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202308132152177.png)

- 原因

  计算包围盒的transform的Scale部分的Radius没乘2

  ```cpp
  glm::vec3 scale = tc.Scale * glm::vec3(cc2d.Radius);	// scale = 0.5
  glm::mat4 transform = glm::translate(glm::mat4(1.0f), translation)
  						* glm::scale(glm::mat4(1.0f), scale);
  ```

- 解决方法

  将计算包围盒的transform的Scale部分的Radius**乘2**

  ```cpp
  glm::vec3 scale = tc.Scale * glm::vec3(cc2d.Radius * 2);	// scale = 1
  glm::mat4 transform = glm::translate(glm::mat4(1.0f), translation)
  						* glm::scale(glm::mat4(1.0f), scale);
  ```

- 详细说明

  这个transform是包围盒跟随物体的变化矩阵，决定了绘画圆形包围盒4个顶点的世界位置。

  ```cpp
  Renderer2D::DrawCircle(transform, glm::vec4(0, 1, 0, 1), 0.01f);
  void Renderer2D::DrawCircle(const glm::mat4& transform, const glm::vec4& color, float thickness, float fade, int entityID)
  {
      for (size_t i = 0; i < quadVertexCount; i++) {
          s_Data.CircleVertexBufferPtr->WorldPosition = transform * s_Data.QuadVertexPosition[i]; 
          ......
  ```

  绘制圆形如何变成了圆环，是由thickness配合glsl代码控制的，可以看前几节。

## Bug3：圆形放大，但是实际参与物理计算的包围盒没放大

- 解释Bug

  ![7.scale3物理计算1](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202308132151018.gif)

  ![](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202308132151578.png)

  圆形scale为3，圆的包围盒虽然显示正确，虽然绘图能正确绘制，但是实际运行物理模拟计算还是为1

  （注意区分：这不是下面Bug2所说的，渲染的包围盒小一半，而是参与物理模拟计算小了）

- 原因

  参与物理计算的圆形包围盒的radius半径**没有跟随物体的放大缩小**。

  ```cpp
  circleShape.m_radius = cc2d.Radius;
  ```

  物体放大为3倍了，而包围盒参与计算的radius没有放大，还是0.5，所以会有bug，应该为1.5的

- 应该改为

  ```cpp
  circleShape.m_radius = transform.Scale.x * cc2d.Radius;
  ```



