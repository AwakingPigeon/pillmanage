# 抑郁服药助手 - APK打包完整指南

## 1. 技术可行性确认

**✅ 完全可行**：基于React Native开发的抑郁服药助手可以完美封装为APK文件，支持Android 9.0+系统。

## 2. 环境准备阶段

### 2.1 必需软件安装
```
1. Node.js 16+ (已安装)
2. Java JDK 11 (必需)
3. Android Studio 2022.1.1+
4. Android SDK 33+
5. React Native CLI
```

### 2.2 环境变量配置
```bash
# Windows系统环境变量设置
ANDROID_HOME = C:\Users\[用户名]\AppData\Local\Android\Sdk
PATH添加：%ANDROID_HOME%\tools;%ANDROID_HOME%\platform-tools
```

### 2.3 验证环境
```bash
# 检查环境是否正确
npx react-native doctor
```

## 3. 项目初始化

### 3.1 创建React Native项目
```bash
# 在指定目录创建项目
npx react-native init DepressionMedicationApp --template react-native-template-typescript
cd DepressionMedicationApp

# 安装必要依赖
npm install @react-navigation/native
npm install react-native-sqlite-storage
npm install @react-native-async-storage/async-storage
npm install react-native-push-notification
```

### 3.2 项目结构
```
DepressionMedicationApp/
├── android/                    # Android原生代码
├── ios/                       # iOS原生代码
├── src/
│   ├── components/           # 通用组件
│   ├── screens/             # 页面组件
│   ├── services/            # 业务服务
│   └── utils/               # 工具函数
├── package.json
└── app.json
```

## 4. APK打包完整流程

### 4.1 开发阶段打包（调试版）
```bash
# 生成调试APK（无签名）
cd android
./gradlew assembleDebug

# 输出位置
android/app/build/outputs/apk/debug/app-debug.apk
```

### 4.2 发布阶段打包（正式版）

#### 4.2.1 生成签名证书（仅需一次）
```bash
# 在项目根目录执行
keytool -genkey -v -keystore depression-medication.keystore -alias depressionmed -keyalg RSA -keysize 2048 -validity 10000

# 输入信息：
# 密码：your-password
# 姓名：公益组织名称
# 组织：公益项目
# 位置：中国
```

#### 4.2.2 配置签名信息
```gradle
// android/app/build.gradle
android {
    signingConfigs {
        release {
            storeFile file("depression-medication.keystore")
            storePassword "your-password"
            keyAlias "depressionmed"
            keyPassword "your-password"
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled true
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
        }
    }
}
```

#### 4.2.3 生成发布APK
```bash
# 生成签名APK
cd android
./gradlew assembleRelease

# 输出位置
android/app/build/outputs/apk/release/app-release.apk
```

#### 4.2.4 生成AAB格式（Google Play推荐）
```bash
# 生成Android App Bundle
./gradlew bundleRelease

# 输出位置
android/app/build/outputs/bundle/release/app-release.aab
```

## 5. 一键打包脚本

### 5.1 Windows批处理脚本
```batch
@echo off
echo 开始打包抑郁服药助手APK...

cd /d E:\file\...02 handbook\obsidian本地库\BaiduSyncdisk\code\P13 pilltime

:: 安装依赖
echo 正在安装依赖...
call npm install

:: 清理旧构建
echo 清理旧构建...
cd android
call gradlew clean

:: 生成发布APK
echo 正在生成发布APK...
call gradlew assembleRelease

:: 检查是否成功
if exist "app\build\outputs\apk\release\app-release.apk" (
    echo 打包成功！
    echo APK位置：%CD%\app\build\outputs\apk\release\app-release.apk
) else (
    echo 打包失败，请检查错误信息
)

pause
```

### 5.2 PowerShell脚本
```powershell
Write-Host "开始打包抑郁服药助手APK..." -ForegroundColor Green

Set-Location "E:\file\...02 handbook\obsidian本地库\BaiduSyncdisk\code\P13 pilltime"

# 安装依赖
Write-Host "安装依赖..." -ForegroundColor Yellow
npm install

# 清理并构建
Set-Location "android"
Write-Host "清理旧构建..." -ForegroundColor Yellow
./gradlew clean

Write-Host "生成发布APK..." -ForegroundColor Yellow
./gradlew assembleRelease

# 检查结果
$apkPath = "app/build/outputs/apk/release/app-release.apk"
if (Test-Path $apkPath) {
    Write-Host "打包成功！" -ForegroundColor Green
    Write-Host "APK位置：$(Get-Location)\$apkPath" -ForegroundColor Cyan
} else {
    Write-Host "打包失败，请检查错误信息" -ForegroundColor Red
}
```

## 6. 应用配置优化

### 6.1 AndroidManifest.xml配置
```xml
<manifest xmlns:android="http://schemas.android.com/apk/res/android">
    
    <!-- 必要权限 -->
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.VIBRATE" />
    <uses-permission android:name="android.permission.WAKE_LOCK" />
    <uses-permission android:name="android.permission.RECEIVE_BOOT_COMPLETED" />
    <uses-permission android:name="android.permission.SCHEDULE_EXACT_ALARM" />
    
    <application
        android:name=".MainApplication"
        android:label="抑郁服药助手"
        android:icon="@mipmap/ic_launcher"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:allowBackup="false"
        android:theme="@style/AppTheme"
        android:largeHeap="true">
        
        <activity
            android:name=".MainActivity"
            android:label="抑郁服药助手"
            android:configChanges="keyboard|keyboardHidden|orientation|screenSize|uiMode"
            android:launchMode="singleTask"
            android:windowSoftInputMode="adjustResize"
            android:exported="true">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
    </application>
</manifest>
```

### 6.2 应用图标配置
```
android/app/src/main/res/
├── mipmap-hdpi/
│   ├── ic_launcher.png (72x72)
│   └── ic_launcher_round.png (72x72)
├── mipmap-mdpi/
├── mipmap-xhdpi/
├── mipmap-xxhdpi/
└── mipmap-xxxhdpi/
```

## 7. 测试验证

### 7.1 真机测试步骤
```bash
# 1. 连接手机（开启USB调试）
adb devices

# 2. 安装到手机
adb install android/app/build/outputs/apk/release/app-release.apk

# 3. 启动应用
adb shell am start -n com.depressionmedication/.MainActivity
```

### 7.2 测试检查清单
- [ ] 应用正常安装
- [ ] 图标显示正确
- [ ] 启动无崩溃
- [ ] 服药提醒功能正常
- [ ] 本地数据存储正常
- [ ] 通知权限获取正常
- [ ] 应用大小在合理范围（<30MB）

## 8. 发布准备

### 8.1 应用信息配置
```json
// app.json
{
  "name": "抑郁服药助手",
  "displayName": "抑郁服药助手",
  "version": "1.0.0",
  "description": "专为抑郁症患者设计的服药管理应用",
  "author": "公益项目团队",
  "license": "MIT"
}
```

### 8.2 应用商店信息
- **应用名称**：抑郁服药助手
- **应用描述**：专为抑郁症患者设计的极简服药管理应用，支持服药提醒、记录追踪、计划管理等功能
- **关键词**：抑郁症、服药提醒、药物管理、健康助手
- **分类**：医疗健康 > 健康管理
- **隐私政策**：本地数据存储，不上传任何个人信息

## 9. 常见问题解决

### 9.1 打包失败处理
```bash
# 清理缓存
./gradlew clean
npm start -- --reset-cache

# 检查依赖
npm audit fix

# 重新安装依赖
rm -rf node_modules
npm install
```

### 9.2 签名问题
```bash
# 检查keystore信息
keytool -list -v -keystore depression-medication.keystore

# 验证APK签名
jarsigner -verify -verbose -certs app-release.apk
```

## 10. 一键部署命令

### 10.1 完整打包命令
```bash
# 从项目根目录执行
npm run build:android

# 或手动执行完整流程
npm install
cd android
./gradlew clean
./gradlew assembleRelease
```

### 10.2 自动化部署
```yaml
# .github/workflows/build.yml
name: Build APK
on:
  push:
    branches: [ main ]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      - name: Build APK
        run: |
          npm install
          cd android
          ./gradlew assembleRelease
```

## 总结

整个APK打包流程预计需要30-60分钟完成，生成的APK文件约15-25MB，支持Android 9.0+系统。通过本指南可以完成从开发到发布的完整流程。