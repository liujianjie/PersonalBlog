> 文中若有代码、术语等错误，欢迎指正

[toc]

# 前言

- 此节目的

  介绍实体组件系统(ECS)的好处以及为什么要实体组件系统

- ECS简介

  是麻省理工啥（不知道有没有错）设计的

  [基于ECS设计的Entt库源码](https://github.com/skypjack/entt)很多行，可以去读。

- 各个商业引擎的都存在ECS模式

  Unity叫Entity为**GameObject**

  UE叫Entity为**actor**

- 本文编写参考文章

  [实体组件系统介绍](https://blog.csdn.net/weixin_26716079/article/details/109122827)

- 提前声明

  此节的内容参考的资料较少，带很多有自己的理解，可能与实际情况存在较大偏差

# ESC1.0继承模式下实现

假设在一个场景中，包含两个不同的实体（Entity1和Entity2），每个实体都需要具备各自特定的组件

例如Entity1需要一个Light组件，而Entity2需要一个Audio组件

- 用单继承的代码写

  ```cpp
  class Scene {
  	std::vector<Entity*> entities;
  };
  class Entity {
  	Mat4 Transform;
  	string Tag;
  };
  class Light : public Entity {
  	vec3 Color;
  	float Intensity;
  };
  class Audio : public Entity {
  	AudioClip* clip;
  };
  // 一个场景
  Scene sc;
  // 有两个不同组件的实体
  Entity* e1 = new Light;
  Entity* e2 = new Audio;
  sc.entities.push_back(e1);
  sc.entities.push_back(e2);
  ```

- 新需求

  当这个场景**再需要**一个实体（Entity3）并具有Audio和Mesh这两个组件时

  就需要再次声明一个**新的子类**（例如AudioMesh），并且需要继承自Audio类。

  ```cpp
  class AudioMesh : public Audio {
  	Mesh* mesh;
  };
  Entity* e3 = new AudioMesh;
  sc.entities.push_back(e3);
  ```

- 类图大概是

  ![image-20230730135019681](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202307302308000.png)

- 缺点

  这样的实现方式可能导致**代码量增加**、**类层次结构复杂**等问题，影响程序的可读性和可维护性。

  造成这样的原因是面向对象的思想，类具有属性和它的函数(行为)，有点高聚合。（个人理解）

# ESC1.1 优化继承模式

## 介绍

假设在一个场景中，包含两个不同的实体（Entity1和Entity2），每个实体都需要具备各自特定的组件

例如Entity1需要一个Light组件，而Entity2需要一个Audio组件

- 优化继承模式代码

  ```cpp
  class Scene {
  	std::vector<Entity*> entities;
  };
  class Entity {
  	Mat4 Transform;
  	string Tag;
  	std::vector<Component*> components;// 注意这个
  };
  struct Component {// 注意这个
  };
  struct Light : public Component {
  	vec3 Color;
  	float Intensity;
  };
  struct Audio : public Component {
  	AudioClip* clip;
  };
  Scene sc;
  Entity e1, e2;
  e1.components.pushback(new Light);
  e2.components.pushback(new Audio);
  sc.entities.push_back(e1);
  sc.entities.push_back(e2);
  ```

  由代码中可以看到，**多了**一个Component结构体父类

- 新需求

  - 当**再需要**一个实体Entity，并具有Audio、Mesh这两个组件

  - 在目前的设计下，就**不需要**再写一个新的子类AudioMesh来继承Audio与Mesh类，而是可以写一个Mesh类**继承**Component。

    实体的vector<Component*> components再添加这个Mesh组件，即可完成此新需求

  ```cpp
  struct Mesh : public Component {
  	Data* data;
  };
  Entity e3;
  e3.components.pushback(new Mesh);
  sc.entities.push_back(e3);
  ```

- 类图

  ![image-20230730140219059](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202307302308683.png)

- 优点

  减少高聚合（个人理解）

## 新缺点

- 引发新缺点的情况

  在一个拥有100万个实体的**场景**中，需要播放这些实体的**音频**

  如果使用Scene中的vector存储实体的方式是指针，同时实体的vector又以指针方式存储组件，则在处理数据时将经历**二次访问**，这样就可能导致CPU性能的浪费和影响游戏性能。

  ![](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202307302308013.png)

- 示例代码

  ```cpp
  class Scene {
  std::vector<Entity*> entities;
     void PlayAllAudio(){
         for(auto &en : entities){ 
             for(auto &au : en->components){ // 一次指向，因为调用了(->)或者(*po.)代表执行获取指针指向的数据
                 if(*au == audio){ 		
                     *au.play();				// 二次指向
                }
            }
        }
    }
  };
  class Entity {
      Mat4 Transform;
      string Tag;
      std::vector<Component*> components;
  };
  ```

- 再次说明造成此问题的原因

  1. 造成耗时的主要原因之一是实体与组件**散布在内存中**，需要通过指针来访问，无法统一管理
  2. 这种设计方式可能导致CPU进行二次访问，从而增加程序的运行时间和资源消耗。

# ECS2.0

- ECS2.0介绍

  是在ECS1.1的基础上优化，克服二次访问缺点

- 克服1.1二次访问缺点理论

  将同类型的组件放置在**连续的存储块**中，从而**减少**对内存的访问次数，并且可以达到更好的性能表现。

  ![](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202307302308016.png)

- 示例代码

  在一个拥有100万个实体的**场景**中，需要播放这些实体的**音频**

  ```cpp
  class Scene {
      std::vector<Entity*> entities;
      ////////////////////////////////////
      std::vector<Audio*> audios;// 新增这个,同类型的组件放置放置在连续的存储卡
     void OnUpdate(){
         for(auto &au : audios){
             if(au != nullptr){
            	*au.play();// audios vector的元素 一次指向
            }
        }
    }
  };
  class Entity {
     int id;// 新增这个
      Mat4 Transform;
      string Tag;
      std::vector<Component*> components;
  };
  Scene sc;
  sc.audios.resize(1000);
   
  Entity e1, e2;
  Component *a2 = new Audio;
  e1.components.pushback(new Light);
  e2.components.pushback(a2);
  // 在音频数组的位置2，放入实体2的音频。
  sc.audios[e2.id] = a2; // e2.id是实体的ID
  ```

  将同一类型的**组件**放置在一个连续的数组中，并使用**实体的ID**作为**下标**来与**实体**进行关联

- 参考图

  ![image-20230730141746103](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202307302308021.png)

  - 解释图

    第一行的数字代表**实体的ID**

  - **竖着看**解释例子

    - 第一列代表实体0组件在对应类型数组的**位置**

      如图，实体**0**只有Light组件，并且实体0的Light组件在Light组件类型**数组**的**0号**位置

    - 第三列代表实体2组件在对应类型数组的**位置**

      如图，实体**2**有Audio、SpriteRenderer组件

      并且实体2的Audio组件在Audio组件类型**数组**的**2号**位置

      并且实体2的SpriteRenderer组件在SpriteRenderer组件类型**数组**的**2号**位置

# 小结

- 此节

  - 此节的内容参考的资料较少，带很多有自己的理解，可能与实际情况存在较大偏差
  - ECS1.0、ECS1.1、ECS2.0是我**自己取**的名来讲解ECS的优化设计过程，不是权威的

- ECS1.0、ECS1.1、ECS2.0

  这三个的Demo代码都是根据视频讲解和参考资料自己写的，可能不正确

- 个人认为ECS2.0

  这ECS2.0的设计模式应该是现代ECS的设计模式（但是也只是我自己的推测，请参考权威文档）

