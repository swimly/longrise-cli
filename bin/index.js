#!/usr/bin/env node
const fs = require('fs');
const program = require('commander');
const download = require('download-git-repo');
const inquirer = require('inquirer');
const handlebars = require('handlebars')
const ora = require('ora');
const chalk = require('chalk');
const logSymbols = require('log-symbols');
const pkg = require('../package.json')

const init = (name) => {
  inquirer.prompt([{
    name: 'description',
    message: '请输入项目描述！'
  }, {
    name: 'author',
    message: '请输入作者名称'
  }, {
    type: 'list',
    name: 'template',
    message: '请选择模板：',
    choices: ['vue2', 'vue3', 'typescript', 'webcomponent']
  }, {
    type: 'list',
    name: 'platform',
    message: '请选择源',
    choices: ['github', 'gitee']
  }]).then(res => {
    const template = res.template
    const platform = res.platform
    console.log(logSymbols.warning, `您选择了[${chalk.green(template)}]模板，即将开始从https://github.com/swimly/${template}拉取模板！`)
    const spinner = ora('正在拉取中……');
    spinner.start()
    var start = (new Date()).getTime()
    download(`${platform}:swimly/${template}`, name, { clone: false }, (err) => {
      if (err) {
        if (err.code === 'ENOTFOUND') {
          spinner.fail(chalk.red(`${platform}尚未发布，请耐心等待！`))
        } else {
          spinner.fail(chalk.red(`由于网络原因，创建不成功，请检查是否能正常访问：https://www.${platform}.com。`))
        }
      } else {
        const distime = ((new Date()).getTime() - start) / 1000
        spinner.succeed(`远程模板拉取成功！`)
        rewritePackage(res, name)
        console.log(logSymbols.success, `总耗时：${distime}s`)
        console.log('执行如下命令：')
        console.log(logSymbols.success, `cd ${name}`)
        console.log(logSymbols.success, `npm install || cnpm install || yarn`)
        console.log(logSymbols.success, `项目启动：yarn dev`)
        console.log(logSymbols.success, `项目打包：yarn build`)
        console.log(logSymbols.success, `启动文档：yarn doc`)
        console.log(logSymbols.success, `打包文档：yarn build:doc`)
      }
    })
  })
}

const rewritePackage = (res, name) => {
  const fileName = `${name}/package.json`;
  const meta = {
    name,
    description: res.description,
    author: res.author
  }
  if (fs.existsSync(fileName)) {
    const content = fs.readFileSync(fileName).toString();
    const result = handlebars.compile(content)(meta);
    fs.writeFileSync(fileName, result);
  }
  console.log(chalk.green('success'));
}

program.version(pkg.version, '-v, --version')
  .command('init <name>')
  .action((name) => {
    if (!fs.existsSync(name)) {
      init(name)
    } else {
      inquirer.prompt({
        type: 'confirm',
        name: 'cover',
        message: `${name}目录已存在，请确认是否要覆盖？`
      }).then(res => {
        if (res.cover) {
          init(name)
        }
      })
    }
  })
program.parse(process.argv)