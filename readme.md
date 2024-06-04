# AWS BEDROCK 서비스

해당 레포지토리는 왜 AWS BEDROCK 서비스를 사용하게 되었고, 이를 어떻게 사용하여 하나의
프로그램을 만들었는지를 성명하고 코드를 보여주는 레포지토리입니다.

## 사용하게 된 배경

저희 회사의 서비스중 사용자들이 중요 하게 생각 하는 기능이 있습니다.
시약병을 사진으로 찍어서 이를 자동으로 제조사, 상품명 등등 각종 정보를 저희가 제공하는
시약 관리 프로그램에 등록하게 하는 기능입니다.
(이걸 불법으로 이용해서 사업적으로 이용한 업체도 있었습니다. 저희 회사는 이걸 다 모니터링 하고 있는데 어찌 이런짓을 하셔서 당시 사업적으로 취득한 금액보다 더 많은 보상을 하시게 되셨죠.)

근데, 제가 이 회사에 왔을때는 이걸 만든 ML 개발자분들이 퇴사하신 상황이고, 더 이상 해당 프로그램을 유지 보수 할 수 있는 인원이 없었습니다.

새로운 상품들은 계속 적으로 나오고 저희 서비스는 이를 분석하지 못하고 있는 실정이었습니다.
이를 개선 하기 위해 AWS의 서비스들을 이용하여 해결 하기 위해 고분분투하며 AWS Korea의 SA분들께 도움을 구하며 이런저런 테스트를 진행하던 중 해당 서비스를 소개 받고 한번 도전해 보았습니다.

#### **결론은 이를 이용해서 새로운 서비스가 나왔습니다.**

## 누가 이걸 사용해야 할까요?

귀사에 또는 본인이 AI 개발자라면 더 좋게 빠른시간안에 이용할 수 있고, 나는 백엔드 엔지니어인데요(저도요!) 라고 하시면 최고의 방법이라 생각이듭니다.
AI 로직은 신경망 로직인데 저는 로직의 첫공식부터 아예 외계인언어 였습니다.
그리고 비지니스 로직 만들기에도 바쁜데...회사에 AI 개발자는 없고, 이때 최고의 방법 입니다.

## 사용법

BEDROCK 서비스는 현재 한국 리전은 지원 하지 않으며, 가장 많은 AI 모델은 버지니아 북부에서 지원하고 있습니다. 그러므로 버지니아 북부 리전으로 이동합니다.

많은 모델들이 존재 합니다.

이제 Bedrock의 여러모델중 Anthropic사의 claude3 Sonnet 모델을 이용하여 한번 해보겠습니다.

오른쪽 메뉴를 누르고
파운데이션 모델 -> 기반모델 을 누릅니다.

그러면 모델들이 보일텐데 가장 많은 분들이 사용하시고 저도 사용한 Anthropic사의 claude Sonnet 모델 클릭후
상단의 모델 엑세스 권한 요청을 합니다.

시간이 약간 지난후 메일로 권한 요청에 대한 결과를 알려주고, 콘솔로 오시면 이렇게 보입니다.
![](https://i.ibb.co/d2fr3Z7/2024-06-04-10-03-10.png)

이제 IAM 으로 이동하여 IAM생성 또는 권한 추가를 합니다.

> AmazonBedrockFullAccess

을 추가해 줍니다.

### 소스 설명

아주 간단한 소스 입니다.

해당 소스의 동작은 이렇습니다.

1. 라벨을 사진을 찍어 해당 사진 파일을 읽어 base64 인코딩 합니다.
2. claude3에게 보낼 prompt를 작성합니다.
3. Bedrock에게 해당 prompt를 보냅니다.
4. 응답을 받습니다. 응답은 프로그램에서 이용할 수 있게 내가 지정한 json 형태로 받습니다.

typescript를 이용한 서비스 입니다.

    npm install @aws-sdk/client-bedrock-runtime

해당 페키지를 이용하여 bedrock을 이용할 거입니다. 꼭 runtime 페키지여야 합니다.
해당 SDK 명령은 [SDK Document](https://docs.aws.amazon.com/ko_kr/code-library/latest/ug/javascript_3_bedrock-runtime_code_examples.html 'SDK Document')
가셔서 보시면 됩니다.

    const bedRockClient = new BedrockRuntimeClient({
      region: 'us-east-1',
      credentials: {
        accessKeyId: 'IAM 억세스키',
        secretAccessKey: 'IAM 비밀키',
      },
    })

해당 런타임 클라이언트를 선언해줍니다.

    const commandBedrock = async (payload: BedrockPromptInterface) => {
      const command = new InvokeModelWithResponseStreamCommand({
        contentType: 'application/json',
        body: JSON.stringify(payload),
        modelId: 'anthropic.claude-3-sonnet-20240229-v1:0',
      })
      const apiResponse = await bedRockClient.send(command)
      let completeMessage = ''
      for await (const item of apiResponse.body) {
        const chunk = JSON.parse(new TextDecoder().decode(item.chunk.bytes))
        const chunk_type = chunk.type
        if (chunk_type === 'content_block_delta') {
          const text = chunk.delta.text
          completeMessage = completeMessage + text
        }
      }
      return completeMessage
    }

해당 부분이 실제 보내는 부분입니다. model 리스트는 ListFoundationModels 를 사용하여 보시면 됩니다.
여기서 약간 주의 할 부분은 응답부분입니다. 응답이 string으로 오는게 아니라 buffer로 오는걸로 확인했습니다. 아마 직접 채팅창을 이용할때 한줄씩 주는걸 고대로 응답으로 받아 어쩔수없이 chunk buffer에 라인별로 있어 이걸 loop돌려 하나의 string으로 만들어 줍니다.

나머지 부분은 설명 없어도 다들 보기 편하실 거라 생각합니다.
prompt json 규격은 [https://docs.anthropic.com/en/api/messages](https://docs.anthropic.com/en/api/messages 'https://docs.anthropic.com/en/api/messages')
가시면 자세히 보실 수 있습니다.

실행해보시면 응답으로
response {
"product": "Daejung",
"name": "Hydrochloric acid"
}
나오는걸 보실 수 있습니다.

이런식으로 비지니스 로직을 더해서 만드시면 될거같습니다.

## 어떻게 구성하여 사용하는가

저희 서비스는 아키텍처를 아래와 같이 만들었습니다.

1. 사진을 S3에 업로드 합니다.
2. SQS에 대당 정보를 퍼블리싱 합니다.
3. Lambda를 트리거로 이를 consumer 하여
4. ecs에 bedrock을 실행하고 비지니스로직을 입힌 배치 프로그램이 동작합니다.

이렇게 구성을 하여 현재 사용자 부분에는 적용을 하지 않고, 내부 직원들이 쓰는 프로그램에 적용하여
테스트 중입니다.

## 아쉬운점 및 조심하여야 할 것

아쉬운점은 openai의 GTP4o 모델이 포함되면 더 좋을거같아요.
어쩔 수 없이 비교를 위해 azure의 openai서비스를 이용하여 교차 비교 했습니다.

조심 하실점이 있습니다.
이 모델들이 ~~거짓말~~을 합니다. 즉, 추론을 하기에 엉뚱한 값이 나오기도 합니다.
이를 못하게 프롬프트에 충분히 디테일하게 설명을 하셔야 합니다.
