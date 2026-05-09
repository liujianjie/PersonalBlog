# OpenGL摄像机基本概念

OpenGL本身没有**摄像机**(Camera)的概念，但我们可以通过把场景中的所有物体往相反方向移动的方式来模拟出摄像机，产生一种**我们**在移动的感觉，而不是场景在移动。

# 摄像机/观察空间

- 摄像机/观察空间简介

  讨论的是摄像机作为场景**原点**时**场景中所有的顶点坐标**：

  **观察矩阵**把所有的世界坐标变换为**相对于摄像机位置与方向**的观察坐标。

  ![](图片/1.9摄像机/camera_axes.png)

- 定义一个摄像机需要
  - 摄像机世界空间中的位置
  - 摄像机观察的方向
  - 指向它右侧的向量
  - 指向它上方的向量

## 摄像机的位置

```cpp
glm::vec3 cameraPos = glm::vec3(0.0f, 0.0f, 3.0f);
```

摄像机向后移动，z轴大于0

## 摄像机的方向

- 什么是摄像机的方向

  看第一张图的第二张小图

  原点出发，指向摄像机的方向：即摄像机的位置减去原点位置

  ```cpp
  glm::vec3 cameraTarget = glm::vec3(0.0f, 0.0f, 0.0f);
  glm::vec3 cameraDirection = glm::normalize(cameraPos - cameraTarget);
  ```
  
- 摄像机**指向的**方向（不要搞反）

  与摄像机的方向**相反**

  是从摄像机出发，指向原点的方向：即原点位置减去摄像机位置

  ```cpp
  glm::vec3 cameraTarget = glm::vec3(0.0f, 0.0f, 0.0f);
  glm::vec3 cameraDirection = glm::normalize(cameraTarget - cameraPos);
  ```

## 右轴

- 什么是右轴

  看第一张图的第三张小图：指向摄像机**右**侧的向量

- 如何计算出来

  - 先定义一个**上向量**

  - 把上向量和**摄像机的方向**向量进行**叉乘**

    ```cpp
    glm::vec3 up = glm::vec3(0.0f, 1.0f, 0.0f); 
    glm::vec3 cameraRight = glm::normalize(glm::cross(up, cameraDirection));
    ```

    - 说明cross函数的参数顺序

      cross第一个参数为up、第二个参数为cameraDirection，会得到指向X轴**正**方向向量
    
      若第一个参数为cameraDirection、第二个参数为up，会得到指向X轴**负**方向向量
    
    - 测试为什么cross的参数顺序决定**指向方向**
    
      up(0, 1, 0)、cameradirection(0, 0，1)，叉乘后，（1,0,0），x>0自然是正方向
    
      cameradirection(0, 0, 1)、up(0, 1，0)，叉乘后，（-1,0,0），x<0自然是**负**方向
  

## 上轴

- 什么是上轴

  看第一张图的第四张小图：指向摄像机**上**方的向量

- 如何计算出来

  **右**向量和摄像机的方向向量进行**叉乘**

  ```cpp
  glm::vec3 cameraUp = glm::cross(cameraDirection, cameraRight);
  ```

  - 再次测试为什么cross的参数顺序决定**指向方向**

    cDirection(0, 0, 1)、cRight(1, 0，0)，叉乘后，（0,1,0），y>0自然是**正**方向

    cRight(1, 0，0)、cDirection(0, 0, 1)，叉乘后，（0,-1,0），y<0自然是**负**方向

## LookAt

- 如何组成一个坐标空间

  如果使用3个**相互垂直**（或非线性）的轴定义了一个坐标空间，你可以用这3个轴**外加一个平移**向量来创建一个矩阵，并且你可以用这个矩阵乘以任何向量来将其**变换**到那个坐标空间

- 摄像机的LookAt矩阵

  ![](图片/1.9摄像机/LookAt.png)

  - 解读
    - 其中**R**是右向量，**U**是上向量，**D**是方向向量，**P**是摄像机位置向量
    - 位置向量是**相反**的，我们最终希望把世界平移到与我们自身移动的**相反**方向

  LookAt矩阵作为摄像机的**观察矩阵**

- glm已提供创建LookAt矩阵的函数

  ```cpp
  glm::mat4 view;
  view = glm::lookAt(glm::vec3(0.0f, 0.0f, 3.0f), 
             glm::vec3(0.0f, 0.0f, 0.0f), 
             glm::vec3(0.0f, 1.0f, 0.0f));
  ```

  - 参数解读

    - 第一个：摄像机的位置

      不用手动按照上一点的LookAt矩阵P位置取负，glm的lookAt函数内部**自动取负**

    - 第二个：摄像机看向的目标点

      用来计算摄像机的方向：摄像机的位置减去目标位置

    - 第三个：上向量

  - glm的lookAt函数会像上面讨论的步骤得到LookAt矩阵（观察矩阵）

    - 先摄像机的位置减去目标位置得到摄像机的方向，**D**（会normalize，向量长度为1）
    - 再与第三个向量cross得到x正方向，**R**（会normalize，向量长度为1）
    - 再x正方向与摄像机方向cross得到y正方向，**U**

- 摄像机看向原点，绕着圆转例子

  ```cpp
  float radius = 10.0f;
  float camX = sin(glfwGetTime()) * radius;
  float camZ = cos(glfwGetTime()) * radius;
  glm::mat4 view;
  view = glm::lookAt(glm::vec3(camX, 0.0, camZ), glm::vec3(0.0, 0.0, 0.0), glm::vec3(0.0, 1.0, 0.0)); 
  ```
  
  ![](图片/1.9摄像机/9.1绕着原点旋转效果.png)

# 自由移动-重点

为了创建符合FPS的摄像机移动方式

- 变量定义

  ```cpp
  glm::vec3 cameraPos   = glm::vec3(0.0f, 0.0f,  3.0f);
  glm::vec3 cameraFront = glm::vec3(0.0f, 0.0f, -1.0f);
  glm::vec3 cameraUp    = glm::vec3(0.0f, 1.0f,  0.0f);
  ```

  ```cpp
  view = glm::lookAt(cameraPos, cameraPos + cameraFront, cameraUp);
  ```

  lookAt第二个参数为什么要加cameraPos，可以直接看第3点**小结**

  - 若lookAt第二个参数不加cameraPos

    cameraFront(0, 0, -1)

    - 当cameraPos(0, 0, 3)

      摄像机的方向：(0, 0, 3)-（0,0，-1）=（0,0，4）

    - 当camearPos（0,0，-3）

      摄像机的方向：(0,0,**-3**)-（0,0，-1)=（0,0,-2）

    摄像机的方向会随着自身位置而**改变**，从而**永远会绕着**cameraFront(0,0,-1)移动，而不是永远注视前方，**不符合**FPS游戏的风格

  - 若第二个参数加cameraPos

    cameraFront(0, 0, -1)

    - 当cameraPos(0, 0, 3)

      lookAt第二个参数：cameraPos + cameraFront =（0,0,2）
    
      摄像机的方向：(0, 0, 3)-（0,0，2）=（0,0，1）
    
    - 当camearPos（0,0，-0.5）
    
      lookAt第二个参数：cameraPos + cameraFront =（0,0,-1.5）
    
      摄像机的方向：(0, 0, **-0.5**)-（0,0，-1.5)=（0,0,1）
    
    - 当camearPos（0,0，-3）
    
      lookAt第二个参数：cameraPos + cameraFront =（0,0,-4）
      
      摄像机的方向：(0, 0, **-3**)-（0,0，-4)=（0,0,1）
    
  - 小结：为什么要加cameraPos

    由于lookAt函数第二个参数（摄像机看向的目标点）lookpoint = cameraPos + cameraFront(0,0,-1)
    
    摄像机的方向**D** = cameraPos - lookpoint = cameraPos - cameraPos - camerFront(0, 0, -1) = (0,0,1)
    
    所以**摄像机的方向永远是(0,0,1);**
    
    对应第一张图的第2张小图，摄像机的镜头对着原点，而自己的方向是（0,0,1）
    
    ![](图片/1.9摄像机/摄像机的方向与指向方向.png)
    
    代表摄像机永远注视**自己前方**（符合FPS摄像机风格），而不是绕着一个点旋转移动。
    
    原文是：说这样能保证无论我们怎么移动，摄像机都会注视着目标方向
    
    >- 又一疑问点
    >
    >  既然摄像机的方向永远是(0, 0, 1)，摄像机指向方向是（0, 0, -1)，是不是说摄像机永远对着**世界空间坐标系**的（0, 0, -1)一个点位置看？
    >
    >- 结论
    >
    >  错误的理解
    >
    >- 分析（自己猜的，得验证，可以跳过吧）
    >
    >  结合LookAt矩阵的组成：3个**相互垂直**R右轴U上方D方向向量组成的矩阵 乘以 由P摄像机的位置组成的矩阵。
    >
    >  其中3个**相互垂直**RUD向量组成的矩阵已经定义了一个**新的坐标空间**，再乘以由P摄像机的位置得到LookAt矩阵。
    >
    >  LookAt矩阵是以摄像机位置为原点的摄像机的**观察矩阵**（观察矩阵不是新的坐标空间，此时依旧是RUD向量组成的坐标空间）。
    >
    >  这个观察矩阵乘以场景中物体的所有的顶点向量从而将场景变换到这个**新的坐标空间**。
    >
    >  所以说这个摄像机指向方向(0, 0, -1)，不是指向世界空间坐标系的（0, 0, -1)点位置，而是指向以摄像机位置为原点**新的坐标空间**的（0, 0, -1)点位置，也就是摄像机自己的前方。

- WASD控制

  ```cpp
  void processInput(GLFWwindow *window){
      ...
      float cameraSpeed = 0.05f; // adjust accordingly
      if (glfwGetKey(window, GLFW_KEY_W) == GLFW_PRESS)
          cameraPos += cameraSpeed * cameraFront;
      if (glfwGetKey(window, GLFW_KEY_S) == GLFW_PRESS)
          cameraPos -= cameraSpeed * cameraFront;
      if (glfwGetKey(window, GLFW_KEY_A) == GLFW_PRESS)
          cameraPos -= glm::normalize(glm::cross(cameraFront, cameraUp)) * cameraSpeed;
      if (glfwGetKey(window, GLFW_KEY_D) == GLFW_PRESS)
          cameraPos += glm::normalize(glm::cross(cameraFront, cameraUp)) * cameraSpeed;
  }
  ```
  
  cameraPos = (0, 0, 0)；cameraFront = (0, 0, -1)；cameraSpeed = (0，0，1)；cameraUp = （0，1， 0）
  
  - WS中拿W代值举例子，S省略
  
    ```cpp
    cameraPos += cameraSpeed * cameraFront;
    cameraPos = (0, 0, 0) + (0, 0, 1) * (0，0，-1) = (0, 0, -1) 
    ```
  
    可见cameraPos的z轴，从0到-1，由于OpenGL的右手坐标系，确实是向前移动
  
  - AD与WS差不多，都可以参考上面W代值举例子，但这里说明
  
    glm::cross(cameraFront, cameraUp)得出是**右向量**(Right Vector)
    
    ```cpp
    cameraFront(0, 0, -1)、cameraUp(0, 1，0)，叉乘后，（1,0,0），x>0是正方向
    ```
  
  >注意，我们对右向量进行了标准化**normalize**。如果我们没对这个向量进行标准化，最后的叉乘结果会根据cameraFront变量返回大小不同的向量。
  >如果我们不对向量进行标准化，我们就得根据摄像机的朝向不同**加速或减速**移动了，但如果进行了标准化移动就是 **匀速** 的。

## 移动速度

- 目前的问题

  目前我们的移动速度是个常量，据配置的不同，有些人可能会比其他人每秒绘制更多帧，也就是以更高的频率调用processInput函数

  就会造成有些人可能移动很快，而有些人会移动很慢。

- 如何解决

  图形程序和游戏通常会跟踪一个时间差(Deltatime)变量，它储存了渲染上一帧所用的时间。我们把所有速度都去乘以**deltaTime**值。

- 为什么能解决

  如果我们的deltaTime很大，就意味着上一帧的渲染花费了更多时间，所以这一帧的速度需要变得更高来平衡渲染所花去的时间。

  使用这种方法时，无论你的电脑快还是慢，摄像机的速度都会相应平衡，这样每个用户的体验就都一样了。

- 代码

  ```cpp
  float deltaTime = 0.0f; // 当前帧与上一帧的时间差
  float lastFrame = 0.0f; // 上一帧的时间
  ```

  ```cpp
  float currentFrame = glfwGetTime();
  deltaTime = currentFrame - lastFrame;
  lastFrame = currentFrame;
  ```

  ```cpp
  void processInput(GLFWwindow *window)
  {
    float cameraSpeed = 2.5f * deltaTime;
    ...
  }
  ```
  
- 个人举例

  - 问题描述

    若规定每帧移动速度为speed = 60m/s

    若屏幕的HZ为60帧，那么它1秒会移动60次，60 * speed = 3600m

    若屏幕的HZ为100帧，那么它1秒会移动100次，100*speed = 6000m

  - deltatime计算

    HZ为60的，1/60 = 0.01666666

    HZ为100的，1/100 = 0.01

  - 按照理论代入值乘以deltatime解决

    若规定每帧移动速度为speed = 60m/s

    若屏幕的HZ为60帧，那么它1秒会移动60次，60 * speed * deltatime(1/60) = 60m

    若屏幕的HZ为100帧，那么它1秒会移动100次，100*speed * deltatime(1/100)= 60m

    S = HZ * 1 / HZ * speed = speed，即解决


# 视角移动 - 重点

为了能够改变视角，我们需要根据鼠标的输入改变**cameraFront**向量，从而实现能改变摄像机看向的方向=转向

## 欧拉角

- 图示

  3种欧拉角：俯仰角(Pitch)、偏航角(Yaw)和滚转角(Roll)

  ![](图片/1.9摄像机/camera_pitch_yaw_roll.png)

- 前置知识

  ![](图片/1.9摄像机/修复camera_triangle.png)

  如果我们把斜边边长h定义为1

  - 邻边x的长度是cosθ= x/h= x/1=x
  - 对边y的长度是sinθ = y/h= y/1=y

- 根据前置知识能推导计算direction的xyz

  注意区分：前置知识是2D坐标系，这里的图是3D坐标系

  ![](图片/1.9摄像机/direction计算.jpg)

  这张推导图来源于原网址的评论区

- 由图示的glm代码

  对应推理图的3个**波浪线**所画的

  ```cpp
  direction.x = cos(glm::radians(pitch)) * cos(glm::radians(yaw)); // 译注：direction代表摄像机的前轴(Front)，这个前轴是和本文第一幅图片的第二个摄像机的方向向量是相反的
  direction.y = sin(glm::radians(pitch));
  direction.z = cos(glm::radians(pitch)) * sin(glm::radians(yaw));
  ```

  这样我们就有了一个可以把俯仰角度和偏航角度转化为用来**自由旋转视角**的摄像机的3维方向向量了

- 疑问点

  疑问：direction是摄像机的方向，还是摄像机的指向方向（原文没说清楚，只说摄像机的3维方向向量）

  解答：是摄像机的指向方向，解答过程在下面

## 鼠标输入

- 要这个干嘛

  用来计算俯仰角度或偏航角度

- 如何用鼠标移动来算角度

  储存上一帧鼠标的位置，在当前帧中我们当前计算鼠标位置与上一帧的位置相差多少。

  如果水平/竖直差别越大那么俯仰角或偏航角就改变越大，也就是摄像机需要移动更多的距离

- 最终获取方向向量步骤与代码

  0. 设置鼠标输入回调函数

     ```cpp
     glfwSetInputMode(window, GLFW_CURSOR, GLFW_CURSOR_DISABLED);// 屏幕不显示鼠标
     void mouse_callback(GLFWwindow* window, double xpos, double ypos);
     glfwSetCursorPosCallback(window, mouse_callback);
     ```
  
  1. 计算鼠标距上一帧的偏移量。
  
  2. 把偏移量添加到摄像机的俯仰角和偏航角中。
  
     ```cpp
     float xoffset = xpos - lastX;
     // 注意下面计算y的偏移量是相反的
     /*
     	我们希望y坐标是从底部往顶部依次增大的
     	但是glfwSetCursorPosCallback得到的是屏幕左上角的坐标为（0，0），所以越往上的y值越小，不符合坐标系中y轴朝上规	则，所以得改变
     */
     float yoffset = lastY - ypos; 
     lastX = xpos;
     lastY = ypos;
     
     float sensitivity = 0.05f;
     xoffset *= sensitivity;
     yoffset *= sensitivity;
     
     yaw += xoffset;
     pitch += yoffset;
     ```
  
  3. 对偏航角和俯仰角进行最大和最小值的限制。
  
     ```cpp
     if(pitch > 89.0f)
       pitch =  89.0f;
     if(pitch < -89.0f)
       pitch = -89.0f;
     ```
  
  4. 计算方向向量。(通过俯仰角和偏航角)
  
     ```cpp
     glm::vec3 front;
     front.x = cos(glm::radians(pitch)) * cos(glm::radians(yaw));
     front.y = sin(glm::radians(pitch));
     front.z = cos(glm::radians(pitch)) * sin(glm::radians(yaw));
     cameraFront = glm::normalize(front);
     ```
  
- **疑问：direction=cameraFront是摄像机的方向，还是摄像机的指向方向？**
  
  - 由**自由移动**那节推导小结
  
    ```cpp
    glm::mat4 view = glm::lookAt(cameraPos, cameraPos + cameraFront, cameraUp);
    ```
    
    由于Center = cameraPos + cameraFront(0,0,**-1**)
    
    摄像机的方向D = cameraPos - Center = cameraPos - cameraPos - camerFront(0,0,-1)=**(0,0,1)**
    
    所以**摄像机的方向永远是(0,0,1);**
    
    对应第一张图的第2张小图，摄像机的镜头对着原点，而自己的方向是（0,0,1）
    
    代表摄像机永远注视**自己前方**（摄像机的指向方向（0，0，-1））。
    
  - 代值计算
  
    根据yaw和pitch角度对cameraFront的x y z重新计算
  
    若cameraFront(0, 1, 0)
  
    由于Center = cameraPos + cameraFront(0,1,0)
  
    摄像机的方向**D** = cameraPos - Center = cameraPos - cameraPos - camerFront(0, 1, 0)=**(0,-1,0)**
  
    摄像机的方向是(0, -1, 0)；**代表摄像机指向方向是(0, 1, 0) = cameraFront**，看向右方
  
  - 所以
  
    direction = cameraFront是**摄像机的指向方向**。
    
    ![](图片/1.9摄像机/摄像机的方向与指向方向.png)
  
- 此节重要流程与目的

  由鼠标偏移值计算yaw，pitch角度，而这两个角度关乎摄像机的指向方向

  1.于是yaw和pitch重新计算**摄像机的指向方向**，**从而实现移动鼠标位置改变视角的功能**

  2.当改变摄像机位置，根据摄像机的指向方向而正确的移动

  ```cpp
  // normalize the vectors, because their length gets closer to 0 the more you look up or down which results in slower movement.
  if (glfwGetKey(window, GLFW_KEY_W) == GLFW_PRESS)
      cameraPos += cameraSpeed * cameraFront;
  if (glfwGetKey(window, GLFW_KEY_S) == GLFW_PRESS)
      cameraPos -= cameraSpeed * cameraFront;
  if (glfwGetKey(window, GLFW_KEY_A) == GLFW_PRESS)
      cameraPos -= glm::normalize(glm::cross(cameraFront, cameraUp)) * cameraSpeed;
  if (glfwGetKey(window, GLFW_KEY_D) == GLFW_PRESS)
      cameraPos += glm::normalize(glm::cross(cameraFront, cameraUp)) * cameraSpeed;
  ```

  - 保证WS永远朝着**摄像机指向方向**（前方）移动
  - 保证AD永远朝着**垂直于摄像机指向方向的右向量**移动

## 缩放

- 如何实现缩放

  **视野**(Field of View)或**fov**定义了我们可以看到场景中多大的范围

  当视野fov变小时，场景投影出来的空间就会**减小**，产生放大(Zoom In)了的感觉

- 关键代码

  - 控制fov改变

    ```cpp
    glfwSetScrollCallback(window, scroll_callback);//注册鼠标滚轮的回调函数
    void scroll_callback(GLFWwindow* window, double xoffset, double yoffset)// 鼠标滚轮的回调函数
    {
      if(fov >= 1.0f && fov <= 45.0f)
        fov -= yoffset;
      if(fov <= 1.0f)
        fov = 1.0f;
      if(fov >= 45.0f)
        fov = 45.0f;
    }
    ```
  
    因为`45.0f`是默认的视野值，我们将会把缩放级别(Zoom Level)限制在`1.0f`到`45.0f`。
  
  - 每一帧都必须把透视投影矩阵上传到GPU，并且现在使用fov变量作为它的视野
  
    ```cpp
    projection = glm::perspective(glm::radians(fov), 800.0f / 600.0f, 0.1f, 100.0f);
    ```
  
- 效果

  ![](图片/1.9摄像机/9.2放大效果.png)

- 原文说要注意的

  >使用欧拉角的摄像机系统并不完美。根据你的视角限制或者是配置，你仍然可能引入万向节死锁问题。最好的摄像机系统是使用四元数(Quaternions)的，但我们将会把这个留到后面讨论。（译注：这里可以查看四元数摄像机的实现）


