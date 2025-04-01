import { $Command, ConnectClient } from '@aws-sdk/client-connect';

// Tried to generify this but the typings are really weird to work around so anyone using this has to explicitly specify
// the command's OutputType; which they could get wrong if it doesn't match the command. It's not perfect but at least it's reusable.
export const listCommandRunner = async <
  OutputType extends object & {
    NextToken?: string;
  } & {
    [key in OutputValueKey]?: Array<NonNullable<OutputValueType>> | undefined;
  },
  OutputValueKey extends keyof OutputType,
  OutputValueType = NonNullable<OutputType[OutputValueKey]>[number],
  T extends $Command<any, any, any, any> = $Command<any, any, any, any>
>(
  connectClient: ConnectClient,
  command: T,
  listKey: OutputValueKey
) => {
  let nextToken: string | undefined = undefined;
  const list: NonNullable<OutputValueType>[] = [];
  do {
    command.input.NextToken = nextToken;
    const response: OutputType = await connectClient.send(command);
    nextToken = response.NextToken;
    list.push(...(response[listKey] || []));
  } while (nextToken);
  return list;
};
