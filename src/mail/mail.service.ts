import got from 'got';
import FormData from 'form-data';
import { Inject, Injectable } from '@nestjs/common';
import { CONFIG_OPTIONS } from 'src/common/common.constant';
import { EmailVar, MailModuleOptions } from './mail.interface';

@Injectable()
export class MailService {
  constructor(
    @Inject(CONFIG_OPTIONS) private readonly options: MailModuleOptions,
  ) {}

  async sendEmail(
    subject: string,
    template: string,
    emailVars: EmailVar[],
  ): Promise<any> {
    const form = new FormData();
    form.append('from', `Nolec from 노버  <mailgun@${this.options.domain}>`);
    form.append('to', `ca10205@naver.com`);
    form.append('subject', subject);
    form.append('template', template);
    emailVars.forEach(eVar => form.append(`v:${eVar.key}`, eVar.value));
    try {
      await got(`https://api.mailgun.net/v3/${this.options.domain}/messages`, {
        method: 'POST',
        headers: {
          Authorization: `Basic ${Buffer.from(
            `api:${this.options.apiKey}`,
          ).toString('base64')}`,
        },
        body: form,
      });
    } catch (error) {
      console.log(error);
    }
  }

  sendVerificationEmail(email: string, code: string) {
    this.sendEmail('Verify Your Email', 'init', [
      { key: 'code', value: code },
      { key: 'username', value: email },
    ]);
  }
}
