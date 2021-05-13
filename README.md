### Fursuit Roster Searcher

Fursuit roster searching system using JSON database (database not included)

Searching and crunching numbers are all done on client-side.

### How to Update ```furdb.json```

#### Preparation

- Install Java Runtime Environment onto your computer
- Create a folder named `html`
- Copy over ```Photo.html``` and ```DB.html``` onto the `html` folder

#### Updating

1. Open up Command Prompt/Terminal
2. `cd` into the directory where `makedb.jar` is there
3. Type and run `java -cp makedb.jar Main`
4. Check if the json is actually updated, by checking the "last_update" property

### ```furdb.json``` 업데이트하기

#### 준비

- 자바 실행 환경을 설치해주세요
- `html`이라는 폴더를 생성해주세요
- `Photo.html` 와 `DB.html` 파일을 `html` 폴더에 복사해주세요

#### 업데이트

1. 명령 프롬프트나 터미널을 엽니다
2. `makedb.jar` 파일이 있는 곳으로 `cd`해주세요
3. 다음 명령어를 실행하세요: `java -cp makedb.jar Main`
4. JSON파일이 실제로 업데이트됐는지 확인해주세요. "last_update"의 값이 업데이트를 진행한 시간으로 되어 있어야 합니다.
