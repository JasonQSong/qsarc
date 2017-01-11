import {execSync} from 'child_process'

const bash = (cmd,stdout=1) => {
  const buf=execSync(`set -x; ${cmd}`,{stdio:[0,stdout,2]})
  if(buf){
    const out=buf.toString().trim()
    console.log(out)
    return out
  }
}

const main=()=>{

  const process_cmd=process.argv.slice(1).join(' ')
  bash(`echo "${process_cmd}" >> ~/.qsarchistory`)

  if(bash('git status -s','pipe')!='')
    throw Error('Your repo is dirty')

  if(bash('git rev-parse --abbrev-ref HEAD','pipe')!='dev')
    throw Error('You are not on branch **dev**')

  const root_dir=bash('git rev-parse --show-toplevel','pipe')
  console.log(`+ node process.chdir ${root_dir}`)
  process.chdir(root_dir)

  const files=[]
  for(const target of process.argv.slice(3)){
    if(target.indexOf(':') > -1){
      const pants_filedeps_out=bash(`./pants filedeps ${target}`,'pipe')
      const pants_filedeps=pants_filedeps_out.split('\n').map((filename)=>filename.trim())
      files.push(...pants_filedeps)
    }else{
      files.push(target)
    }
  }

  bash('git fetch --all')
  bash('git update-ref refs/heads/master origin/master')

  console.warn('WARNING: Merge should fail if conflict')
  bash('git merge origin/master --no-edit')

  bash('git checkout master')
  bash(`arc feature ${process.env.USER}/${process.argv[2]}`)
  bash('git merge origin/master --no-commit --no-ff')
  bash('git add --all')
  if(bash('git status -s','pipe')!='')
    bash('git commit --no-edit && true')

  bash(`git checkout dev -- ${files.join(' ')}`)
  bash('git add --all')

  if(bash(`git diff dev --stat -- ${files.join(' ')}`,'pipe')!=''){
    throw Error('Workspace is different from dev')
  }

  bash(`git commit -m "checkout dev for ${process.argv[2]} ${process.argv[3]}"`)

  bash('arc diff')

  bash('git checkout dev')

  return 0
}

process.exit(main())

