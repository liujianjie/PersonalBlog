> 偏文字相关和细节方面，不是很重要

# 事件查看窗口

## 知识点一：事件查看窗口用来做什么？

使用可寻址事件查看窗口可以监视可寻址资源的资源内存管理

该窗口

1. 显示应用程序何时加载和卸载资源
2. 显示所有可寻址系统操作的**引用计数**
3. 显示应用程序帧率和分配的**内存总量**近似图
4. 我们可以通过它来检查可寻址资源对性能的影响
5. 并检查**没有释放**的资源

## 知识点二：打开事件查看窗口

- 前提

  使用事件查看窗口的前提要打开`AddressablesAssetSettings`配置文件中的事件发送开关

  ![image-20240104130048486](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202402182358626.png)

- 两种方式

  1. Window > Asset Management > Addressables > Event Viewer

     ![image-20240104130102474](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202402182357189.png)

  2. Addressabeles Groups > Window > Event Viewer

     ![image-20240104130130192](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202402182357191.png)

## 知识点三：事件查看窗口使用

- 前提

  1. 开启模拟模式

     ![image-20240104130438257](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202402182357033.png)

  2. 使用原始加载代码

     ```csharp
     if (Input.GetKeyDown(KeyCode.Space))
     {
         AsyncOperationHandle<GameObject> handle = Addressables.LoadAssetAsync<GameObject>("Cube");
         handle.Completed += (obj) =>
         {
             Instantiate(obj.Result);
         };
         list.Add(handle);
     
     }
     if (Input.GetKeyDown(KeyCode.Q))
     {
         if(list.Count > 0)
         {
             Debug.Log($"remove {list.Count}");
             Addressables.Release(list[0]);
             list.RemoveAt(0);
         }
     }
     ```

- 左上角

  1. Clear Event：清楚所有记录的帧，会清空窗口中所有内容

     ![image-20240104130621684](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202402182357196.png)

  2. Unhide All Hidden Events：显示你隐藏的所有事件内容（当我们右键一个内容隐藏后才会显示该选项）

     ![image-20240104130710129](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202402182357865.png)

- 右上角

  Frame：显示当前所在帧数

  左按钮和右按钮：在记录的帧中前后切换查看信息

  Current:选中当前帧

  ![image-20240104130808990](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202402182357063.png)

- 中央部分：

  1. `FPS`:应用的帧率
  2. `MonoHeap`：正在使用的托管堆内存量
  3. `Event Counts`：事件计数，某一帧中发生的可寻址事件的数量
  4. `Instantiation Counts`:实例化计数，某一帧中`Addressables.InstantiateAsync`的调用数量
  5. 线性图标：显示统计的什么时候加载释放资源的信息
  6. Event 相关：显示当前帧中发生的可寻址操作的事件

  ![image-20240104131100507](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202402182357939.png)

##     总结

1. 事件查看窗口对于我们来说很有用
2. 我们可以通过它来排查内存泄露相关的信息
3. 比如场景中对象都被移除了，但是事件查看窗口中还有AB引用相关的信息，那证明存在内存泄露
4. 可以排查加载和释放是否没有配对使用

# 分析窗口

## 知识点一：分析窗口有什么作用？

- 分析窗口是一种收集项目可寻址布局信息的工具
- 它是一种信息工具，可以让我们对可寻址文件布局做出更明智的决定

## 知识点二：打开分析窗口

1. Window > Asset Management > Addressables > Analyze

   ![image-20240108124705303](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202402182358406.png)

2. Addressabeles Groups > Tools > Window > Analyze

   ![image-20240108124815505](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202402182359236.png)

## 知识点三：使用分析窗口

分析窗口界面

![image-20240108125103685](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202402182358411.png)

1. `Analyze Selected Rules`:分析选定的规则
2. `Clear Selected Rules`:清除选定规则
3. `Fix Selected Rules`：修复选定规则

### Analyze Selected Rules

- 简要

  分析分组规则什么的是否合理

- 主要检测处理的问题

  1. `Fixable Rules`(可修复的问题)：`Check Duplicate Bundle Dependencies`:资源重复进包

     - 问题描述

       资源a和b，都使用了材质c，a和b是可寻址资源，c不是可寻址资源，a，b分别在两个AB包中，那么这时两个AB包中**都会有**资源c，这时就可以通过该规则排查出该问题

     - 如何解决

       可以选择修复功能（`Fix Selected Rules`）或者自己手动修复

  2. `Unfixable Rules`(不可修复的规则):`Check Resources to Addressable Duplicate Dependencies`:检查可寻址重复依赖项的资源

     资源同时出现在可寻址资源和应用程序构建的资源中

     比如一个资源A，它是可寻址资源

     但是它同时在`Resources`、`StreamingAssets`等特殊文件夹中，最终会被打包出去

  3. `Unfixable Rules`(不可修复的规则):`Check Scene to Addressable Duplicate Dependencies`:检查场景到可寻址重复依赖项

     资源同时出现在可寻址资源和某一个场景中

     比如一个资源A，它是可寻址资源但是它有直接出现在某一个场景中

     这时你需要自己根据需求进行处理

- 操作方式

  1. 需先选中`Analyze Rules`或者`Fixable Rules`或者`UnFixable Rules`

  2. 然后点击`Analyzeselect rules`

     ![image-20240108125816372](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202402182358412.png)

     

### Clear Selected Rules

清除选定规则

### Fix Selected Rules

自动修复选定规则

### Bundle Layout Preview

AB包布局预览

![image-20240108130559634](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202402182358417.png)

其他信息

1. 我们也可以自己定义分析规则

2. 但是这种高级方式我们不是特别常用

3. 你可以参考官方文档：

   https://docs.unity.cn/Packages/com.unity.addressables@1.18/manual/AnalyzeTool.html
   0Extending Analyze拓展分析相关的内容

## 总结

1. 分析窗口对于我们来说也很有用
2. 当我们打包后，我们可以通过分析窗口工具
3. 分析AB包中的资源分布是否合理
4. 根据分析结果自己处理一些潜在问题
