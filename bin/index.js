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
  }]).then(res => {
    const template = res.template
    console.log(logSymbols.warning, `您选择了[${chalk.green(template)}]模板，即将开始拉取模板！`)
    const spinner = ora('正在拉取中……');
    spinner.start()
    var start = (new Date()).getTime()
    download(`direct:https://codeload.github.com/swimly/${template}/zip/master`, name, { clone: false }, (err) => {
      if (err) {
        spinner.fail('失败')
        console.log(err)
      } else {
        const distime = ((new Date()).getTime() - start) / 1000
        spinner.succeed(`远程模板拉取成功！`)
        rewritePackage(res, name)
        console.log(logSymbols.success, `总耗时：${distime}s`)
        console.log('执行如下命令：')
        console.log(logSymbols.success, `cd ${name}`)
        console.log(logSymbols.success, `npm install || cnpm install || yarn`)
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