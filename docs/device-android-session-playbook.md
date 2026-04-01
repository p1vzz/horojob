# Android Device Session Playbook

Инструкция для следующих сессий, чтобы быстро подключаться к телефону и запускать Horojob на реальном Android-девайсе.

## 1. Разовая подготовка телефона

1. Включи `Developer options`.
2. Включи `USB debugging`.
3. Подключи телефон по USB.
4. Подтверди RSA-диалог `Allow USB debugging` на телефоне.

## 2. Подготовка PowerShell в каждой сессии

```powershell
$env:JAVA_HOME='C:\Program Files\Microsoft\jdk-17.0.18.8-hotspot'
$env:ANDROID_HOME='C:\Android\Sdk'
$env:ANDROID_SDK_ROOT='C:\Android\Sdk'
$env:Path="$env:JAVA_HOME\bin;$env:ANDROID_HOME\platform-tools;$env:Path"
```

Проверка:

```powershell
java -version
adb version
```

## 3. Проверка подключения телефона

```powershell
adb kill-server
adb start-server
adb devices
```

Ожидаемый статус: `device` (не `unauthorized`).

## 4. Запуск backend и mobile

Терминал 1 (backend):

```powershell
Set-Location C:\Users\p1vzz\WebstormProjects\horojob-server
npm run dev
```

Терминал 2 (mobile):

```powershell
Set-Location C:\Users\p1vzz\WebstormProjects\horojob
npm run start
```

## 5. Порты для USB-режима (обязательно для физического девайса)

```powershell
adb reverse tcp:8081 tcp:8081
adb reverse tcp:8787 tcp:8787
```

- `8081`: Metro/dev client
- `8787`: Horojob API (`horojob-server`)

## 6. Сборка и установка debug APK

```powershell
Set-Location C:\Users\p1vzz\WebstormProjects\horojob\android
.\gradlew.bat app:assembleDebug
Set-Location C:\Users\p1vzz\WebstormProjects\horojob
adb install -r android\app\build\outputs\apk\debug\app-debug.apk
```

Запуск приложения:

```powershell
adb shell am start -n com.anonymous.horojob/com.anonymous.horojob.MainActivity
```

## 7. Быстрый smoke-check

1. Открывается приложение без крэша.
2. После логина/сессии доступен `Dashboard`.
3. Если тестируешь виджет: long press на Home Screen -> Widgets -> Horojob.

## 8. Fallback при проблеме онбординга (ввод руками, чтобы попасть на Dashboard)

Если flow онбординга глючит, вручную введи профиль пользователя на экране Onboarding:

1. `Date of Birth` (пример: `15/06/1990`).
2. `Time of Birth` (пример: `14:30`) или включи `I don't know my birth time`.
3. `Birth City`: введи город и обязательно выбери элемент из списка подсказок (не просто текст).
4. Нажми центральную кнопку/колесо `Reveal Career Path`.
5. После сохранения должен открыться `Dashboard`.

Если не сохранилось:

1. Проверь backend (`npm run dev`) и `adb reverse tcp:8787 tcp:8787`.
2. Очисти данные приложения и повтори ручной ввод:

```powershell
adb shell pm clear com.anonymous.horojob
```

## 9. Частые проблемы

- `adb devices` показывает `unauthorized`:
  - переподключи USB;
  - на телефоне `Revoke USB debugging authorizations`;
  - снова подтверди RSA.
- Нет связи с API:
  - проверь что backend жив;
  - заново сделай `adb reverse` для `8787`.
- Приложение старой версии:
  - повтори `assembleDebug` + `adb install -r`.
