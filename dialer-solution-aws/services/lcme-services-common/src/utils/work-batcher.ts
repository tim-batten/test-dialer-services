type WorkItem<T, R> = {
  work: T;
  resolve: (value: R) => void;
  reject: (error: any) => void;
};

export type WorkResult<R> = [any | null, R | undefined];

export class WorkBatcher<T, R> {
  workItems: WorkItem<T, R>[] = [];
  constructor(readonly frequency: number, readonly handler: (workItems: T[]) => Promise<WorkResult<R>[]>) {}
  start() {
    if (this.frequency === 0) {
      return;
    }
    setInterval(async () => {
      const workItems = this.workItems.splice(0);
      if (workItems.length > 0) {
        try {
          const results = await this.handler(workItems.map((workItem) => workItem.work));
          results.forEach(([error, value], index) => {
            error ? workItems[index].reject(error) : workItems[index].resolve(value!);
          });
        } catch (e) {
          console.log(e);
        }
      }
    }, this.frequency);
  }
  addWork(work: T) {
    return new Promise<R>((resolve, reject) => {
      if (this.frequency === 0) {
        return this.handler([work]).then(([[error, value]]) => (error ? reject(error) : resolve(value!)));
      }
      this.workItems.push({
        work,
        resolve,
        reject,
      });
    });
  }

  static mapPromiseSettledResult<R>(result: PromiseSettledResult<R>): WorkResult<R> {
    return result.status === "rejected" ? [result.reason, undefined] : [null, result.value];
  }
  static mapPromiseSettledResults<R>(results: PromiseSettledResult<R>[]): WorkResult<R>[] {
    return results.map((result) => WorkBatcher.mapPromiseSettledResult(result));
  }
}
