> 文中若有代码、术语等错误，欢迎指正

[toc]

# 前言

- 此节目的

  为了进入下一个新功能，需要**先维护**好项目

- 要维护或者完善的地方

  - 复制一个实体的所有组件代码、复制一个场景的所有实体的所有组件代码**优化**

    有一个组件就要调用一次函数，很麻烦

  - 取消链接**当前目录**下的vulkan的lib

    直接链接**vulkan安装路径**下的lib

  - 删除按键重复

    因为按键重复总是返回false，可以删除

  - KeyEvent的按键事件检测不到重复事件

# 具体代码

- 取消链接当前目录下的vulkan的lib

  ```cpp
  LibraryDir["VulkanSDK"] = "%{VULKAN_SDK}/Lib"
  -- 这行被注释
  -- LibraryDir["VulkanSDK_Debug"] = "%{wks.location}/GameEngineLightWeight/vendor/VulkanSDK/Lib" 
  ......
  
  Library["ShaderC_Debug"] = "%{LibraryDir.VulkanSDK}/shaderc_sharedd.lib"
  -- Library["ShaderC_Debug"] = "%{LibraryDir.VulkanSDK_Debug}/shaderc_sharedd.lib"
  ......
  ```

- 删除按键重复、修复KeyEvent的按键事件检测不到重复事件

  ```cpp
  bool Input::IsKeyPressed(KeyCode keycode)  {
      auto window = static_cast<GLFWwindow*>(Application::Get().GetWindow().GetNativeWindow());
      auto state = glfwGetKey(window, static_cast<int32_t>(keycode));
      //return state == GLFW_PRESS || state == GLFW_REPEAT;
      return state == GLFW_PRESS;
  }
  ```

  ```cpp
  class KeyPressedEvent : public KeyEvent
  {
  public:
      KeyPressedEvent(const KeyCode keycode, bool isRepeat = false)
          : KeyEvent(keycode), m_IsRepeat(isRepeat) {}
  
      bool IsRepeat() const { return m_IsRepeat; }
  
      std::string ToString() const override
      {
          std::stringstream ss;
          ss << "KeyPressedEvent: " << m_KeyCode << " (repeat = " << m_IsRepeat << ")";
          return ss.str();
      }
  
      EVENT_CLASS_TYPE(KeyPressed)
  private:
      bool m_IsRepeat;
  };
  
  case GLFW_REPEAT :
  {
      KeyPressedEvent event(key, true);
      data.EventCallback(event);
      break;
  }
  ```

- 复制一个实体的所有组件代码优化

  先定义好所有组件的结构体

  ```cpp
  template<typename... Component>
  struct ComponentGroup {
  };
  // (except IDComponent and TagComponent)
  using AllComponents = ComponentGroup<TransformComponent, SpriteRendererComponent,
  CircleRendererComponent, CameraComponent, NativeScriptComponent,
  Rigidbody2DComponent, BoxCollider2DComponent, CircleCollider2DComponent>;
  ```

  ```cpp
  // 为复制实体的辅助方法
  template<typename... Component>
  static void CopyComponentIfExists(Entity dst, Entity src) {
      // 这个lambda会递归调用
      // 隐式引用捕获dst、src或者"解开的Component包引用"，下面的Component是指具体的单个组件
      ([&]() {
          //std::cout << sizeof...(Component) << std::endl;
          if (src.HasComponent<Component>()) {
              dst.AddOrReplaceComponent<Component>(src.GetComponent<Component>());
          }
      }(), ...);// 这三个点应该是解Component包
  }    
  template<typename... Component>
  static void CopyComponentIfExists(ComponentGroup<Component...>, Entity dst, Entity src) {
      CopyComponentIfExists<Component...>(dst, src);
  }
  ```

- 复制一个场景的所有实体的所有组件代码优化

  ```cpp
  // 为复制场景的实体的组件的辅助方法
  template<typename... Component>
  static void CopyComponent(entt::registry& dst, entt::registry& src, const std::unordered_map<UUID, entt::entity>& enttMap) {
      // 这个lambda会递归调用
      // 隐式引用捕获dst、src或者"解开的Component包引用"，下面的Component是指具体的单个组件
      ([&]() {
          auto view = src.view<Component>();
          // 2.1遍历旧场景所有uuid组件的旧实体
          for (auto srcEntity : view) {
              // 2.2用** 旧实体的uuid - map - 对应新实体 * *
              entt::entity dstEntity = enttMap.at(src.get<IDComponent>(srcEntity).ID);
              // 3.1获取旧实体的组件
              auto& srcComponent = src.get<Component>(srcEntity);
              // 3.2然后用API，** 复制旧实体的组件给新实体**
              dst.emplace_or_replace<Component>(dstEntity, srcComponent);
          }
      }(), ...);// 这三个点应该是解Component包
      #if OLD_PATH
          auto view = src.view<Component>();
          // 2.1遍历旧场景所有uuid组件的旧实体
          for (auto e : view) {
              UUID uuid = src.get<IDComponent>(e).ID;
              HZ_CORE_ASSERT(enttMap.find(uuid) != enttMap.end());
              // 2.2用** 旧实体的uuid - map - 对应新实体 * *
              entt::entity dstEnttID = enttMap.at(uuid);
              // 3.1获取旧实体的组件
              auto& component = src.get<Component>(e);
              // 3.2然后用API，** 复制旧实体的组件给新实体**
              dst.emplace_or_replace<Component>(dstEnttID, component);// 添加或替换，保险。组件里面的数据自然会被拷贝
          }
      #endif
  }
  template<typename... Component>
  static void CopyComponent(ComponentGroup<Component...>, entt::registry& dst, entt::registry& src, const std::unordered_map<UUID, entt::entity>& enttMap) {
      CopyComponent<Component...>(dst, src, enttMap);
  }
  ```

# C++知识：模板、模板参数包、函数参数包、参数包转发、扩展参数包、折叠表达式、lambda函数

- 难点

  复制一个实体的所有组件代码、复制一个场景的所有实体的所有组件代码**优化**

- 完整讲述链接

  [点这](https://blog.csdn.net/qq_34060370/article/details/128978681)

- 简化复制实体组件代码

  别名为：**组件代码**

  ```cpp
  #include <iostream>
  using namespace std;
  
  struct TransformComponent {
  	TransformComponent() { cout << "TransformComponent()" << endl; }
  };
  struct SpriteRendererComponent {
  	SpriteRendererComponent() { cout << "SpriteRendererComponent()" << endl; }
  };
  struct CircleRendererComponent {
  	CircleRendererComponent() { cout << "CircleRendererComponent()" << endl; }
  };
  
  template<typename... Component>
  struct ComponentGroup {
  	ComponentGroup() { cout << "ComponentGroup()" << endl; }
  };
  using AllComponents = ComponentGroup<TransformComponent, SpriteRendererComponent,CircleRendererComponent>;
  
  // 为复制实体的辅助方法
  template<typename... Component>
  static void CopyComponentIfExists() {
      // []里无&，因函数体不需要使用外部的变量，不需要捕获
      ([]() {
          cout  << typeid(Component).name() << endl;
      }(), ...);// 折叠表达式，三个点解包
      
      // 这里的解开模板参数包，应该变为多个函数调用的lambda。
      // (func(){}, ...)变成func(){},func(){},func(){}
  }
  template<typename... Component>
  static void CopyComponentIfExists(ComponentGroup<Component...>) {
      CopyComponentIfExists<Component...>();// 模板参数包传递
  }
  void main() {
  	CopyComponentIfExists(AllComponents{});// 传入AllComponents{}代表传入实参，CopyComponentIfExists的模板参数包从函数参数包推断出来
  }
  ```

- 运行结果

  ```cpp
  ComponentGroup()
  3
  struct TransformComponent
  3
  struct SpriteRendererComponent
  3
  struct CircleRendererComponent
  ```

- 如何理解复制一个实体的所有组件代码、复制一个场景的所有实体的所有组件代码

  请按步骤阅读以下的每个小节

## 1.1 模板推断类型

- 参考例子1

  ```cpp
  #include <iostream>
  #include <string>
  using namespace std;
  
  template<typename T>
  static void Func1(T t) {
      T t2 = 8;
      cout << t << " " << t2 << endl;
  }
  template<typename T>
  static void Func2() {
      T t = 7;
      cout << t << endl;
  }
  void main() {
      Func1<int>(3);
      Func1(4);// 这就是省略了声明模板类型，由参数4推断Func1的模板T类型为int
      Func2<int>();
  }
  ```

- 所以可以理解以下代码

  ```cpp
  template<typename... Component>
  struct ComponentGroup {
  	ComponentGroup() { cout << "ComponentGroup()" << endl; }
  };
  using AllComponents = ComponentGroup<TransformComponent,SpriteRendererComponent,CircleRendererComponent>;
  
  template<typename... Component>
  static void CopyComponentIfExists(ComponentGroup<Component...>) {
      // 传给CopyComponentIfExists的模板参数包，为当前函数参数包推断出来的模板参数包
      CopyComponentIfExists<Component...>();
  }
  void main() {
      // 传入AllComponents{}代表传入实参，CopyComponentIfExists的模板类型从实参推断出来
  	CopyComponentIfExists(AllComponents{});
  }
  ```

  在CopyComponentIfExists函数内

  1. ComponentGroup<>，是带有模板参数包的struct

  2. ComponentGroup<Component...>，

     **Component...模板参数包由函数参数包AllComponents{}推断出来**，像上面例子1的Func1(4);

     由于AllComponents = ComponentGroup<TransformComponent,SpriteRendererComponent,CircleRendererComponent>

     传入的函数参数包AllComponents{}

     则能推断出**模板参数包**为
     Component... = TransformComponent, SpriteRendererComponent,CircleRendererComponent

  3. 得到了Component...模板参数包后，**再当做显示的模板**传给下个函数

     代码CopyComponentIfExists<Component...>();
     相当于
     CopyComponentIfExists<TransformComponent, SpriteRendererComponent,CircleRendererComponent>();

## 1.2 参数包转发、递归解包

- 此小节为理解

  - CopyComponentIfExists<Component...>();

    由上分析得，其实执行的代码是

    CopyComponentIfExists<TransformComponent, SpriteRendererComponent,CircleRendererComponent>();

  - 解包概念

- 则给出以下代码

  例子2：显示指定模板参数包类型、并传入函数参数包(与上有点不同，为理解**解包**概念)、并递归解包

  ```cpp
  #include <iostream>
  using namespace std;
  
  // 2.递归解包
  void Func2() { cout << "Func2()，因为解包完了，无参数，就调用此函数，代表递归解包结束" << endl; }// 递归终止函数
  
  template<typename T, typename ...TT>
  void Func2(T& val, TT... args)                          // 函数参数包的第一个赋给第一个参数，剩下的都给参数包args
  {
      cout << val << "-->" << typeid(val).name() << endl;// 打印获取当前参数包的第一个参数值和类型
      
      // 继续解包,将函数参数包传给本函数递归，不指定模板参数包类型，由函数参数包推断出来
      Func2(args...);                                     
  }
  // 1.参数包转发
  template<typename... T>
  void Func1(T... args) {
      /*
          传给Func2函数的模板参数包，为当前函数参数包推断出来的模板参数包，并将多个实参传入
          与CopyComponentIfExists<Component...>();不同，这里有传递实参
      */
      //Func2<T...>(args...); 
      Func2<int, int, char, char const*>(args...);// 与上一段代码调用一样，只不过显示指定模板参数包类型
  }
  void main() {
      cout << "参数包转发、递归解包"<< endl;
      Func1(2, 3, 'c', "12312");
  }
  ```

  ![](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202308132205558.png)

  

## 1.3 不用递归解包-外部函数-折叠表达式

- 引入

  由1.2的例子解包，知道了解包概念和流程，但是为靠近**一开始的组件解包时的代码**，不使用递归而实现的解包代码如下

  ```cpp
  #include <iostream>
  using namespace std;
  
  // 2.不用递归解包
  template <class T>
  void Func2(T val)
  {
      cout << val << "-->" << typeid(val).name() << endl;
  }
  template<typename ...T>
  void Func2(T... args)                          
  {
      /* 
      重点在这：(func(args), ...);
          意思是逐个展开args函数参数包，并将解开的一个参数传入Func2，有多少个参数就有多少个Func2的调用。
          可以理解展开的语句为：Func2(2), Func2(3), Func2('c'), Func2("12312");
      */
      (Func2(args), ...);// 折叠表达式解包
  }
  // 1.参数包转发
  template<typename... T>
  void Func1(T... args) {
      /*
          传给Func2函数的模板参数包，为当前函数参数包推断出来的模板参数包，并将多个实参传入
          与CopyComponentIfExists<Component...>();不同，这里有传递函数参数包
      */
      Func2<T...>(args...); 
      //Func2<int, int, char, char const*>(args...);// 与上一段代码调用一样
  }
  void main() {
      cout << "不用递归解包-外部函数"<< endl;
      // 相当于Func2(2, 3, 'c', "12312");但为了与前一致讲述参数包转发，所以还是Func1
      Func1(2, 3, 'c', "12312"); 
  }
  ```

  ![](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202308132205562.png)

  

## 1.4 不用递归解包-lambda函数-折叠表达式

  由1.3例子的重点那段注释，Func2(args)可以改写成**lambda匿名函数**

  ```cpp
#include <iostream>
using namespace std;

// 2.不用递归解包-并用lamda
template<typename ...T>
void Func2(T... args)
{
    /*
    重点在这：([&](){}(), ...);
        意思是逐个展开args函数参数包，并将解开的一个参数被lambda捕获，有多少个参数就有多少个lambda的调用。
        可以理解展开的语句为：
        args = 2;       [&]() {cout << args << "-->" << typeid(args).name() << endl; }(); 
        args = 3;       [&]() {cout << args << "-->" << typeid(args).name() << endl; }(); 
        args = 'c';     [&]() {cout << args << "-->" << typeid(args).name() << endl; }(); 
        args = "12312"; [&]() {cout << args << "-->" << typeid(args).name() << endl; }();
    */
    // & 隐式引用捕获的是解开args函数参数包，得到一个参数赋给args的变量
    ([&]() {
        cout << args << "-->" << typeid(args).name() << endl;
    }(), ...);// 折叠表达式解包
}
// 1.参数包转发
template<typename... T>
void Func1(T... args) {
    Func2<T...>(args...);
}
void main() {
    cout << "不用递归解包-lambda" << endl;
    Func1(2, 3, 'c', "12312");
}
  ```

![](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202308132205707.png)

## 1.5 lambda+折叠表达式解开模板参数包

由1.4的例子发现与**原组件代码**很接近了，但是原组件代码并没有函数参数包传递，只有推断出来的模板参数包传递。

于是问题再于是否能像1.4代码用**lamda解函数参数包那样解开模板参数包**呢？答案是肯定的，如下

```cpp
#include <iostream>
using namespace std;

// 2.用lamda解开模板参数包
template<typename ...T>
void Func2()
{
    // & 隐式引用捕获的是解开模型参数包，得到一个类型赋给T的变量
    // 但是不写&也行，1.4节要写也许args是参数在函数体内，而这里T是类型且在函数体外所以不用？
    ([]() {
        cout << typeid(T).name() << endl;
     }(), ...);// 折叠表达式
}
// 1.模板参数包转发
template<typename... T>
void Func1(T... args) {
    // 模板参数包的由参数包推断出来
    // <T...> = <int, int, char, const char*>，转发模板参数包
    Func2<T...>();
}
void main() {
    cout << "类似组件-模板参数包转发-lambda解包" << endl;
    Func1(2, 3, 'c', "12312");
}
```

![](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202308132205563.png)

## 1.6 回归组件代码

由以上推导，不难理解原本的组件代码意思和流程了

1. 传入AllComponents{}代表传入实参
2. 第一个函数的模板参数包由函数参数包推断出来
3. 第一个函数推断出来的模板参数包转发，传递给第二个函数
4. 第二个函数接收到传过来的模板参数包
5. 用折叠表达式解开模板参数包，并用lambda输出

```cpp
#include <iostream>
using namespace std;

struct TransformComponent {
	TransformComponent() { cout << "TransformComponent()" << endl; }
};
struct SpriteRendererComponent {
	SpriteRendererComponent() { cout << "SpriteRendererComponent()" << endl; }
};
struct CircleRendererComponent {
	CircleRendererComponent() { cout << "CircleRendererComponent()" << endl; }
};

template<typename... Component>
struct ComponentGroup {
	ComponentGroup() { cout << "ComponentGroup()" << endl; }
};
using AllComponents = ComponentGroup<TransformComponent, SpriteRendererComponent,CircleRendererComponent>;

// 4.接收到传过来的模板参数包
// <Component...> = <TransformComponent, SpriteRendererComponent,CircleRendererComponent>
template<typename... Component>
static void CopyComponentIfExists() {
    // 5.解开模板参数包，并用lambda输出
    ([]() {
        cout  << typeid(Component).name() << endl;
    }(), ...);// (, ...)折叠表达式解包
}
// 2.模板参数包由函数参数包推断出来
template<typename... Component>
static void CopyComponentIfExists(ComponentGroup<Component...>) {
	// 3.推断出来的模板参数包转发，传递
    CopyComponentIfExists<Component...>();
    // <Component...> = <TransformComponent, SpriteRendererComponent,CircleRendererComponent>
}
void main() {
    cout << "1.6 回归组件代码"<<endl;
	CopyComponentIfExists(AllComponents{});// 1.传入AllComponents{}代表传入实参
/*
由于：
	AllComponents{} = ComponentGroup<TransformComponent, SpriteRendererComponent,CircleRendererComponent>()
所以：
    CopyComponentIfExists(AllComponents{});
    等价
    CopyComponentIfExists(ComponentGroup<TransformComponent, SpriteRendererComponent, CircleRendererComponent>());
*/
}
```

![](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202308132205470.png)
