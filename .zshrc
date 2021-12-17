#
# Executes commands at the start of an interactive session.
#
# Authors:
#   Sorin Ionescu <sorin.ionescu@gmail.com>
#

# Source Prezto.
if [[ -s "${ZDOTDIR:-$HOME}/.zprezto/init.zsh" ]]; then
  source "${ZDOTDIR:-$HOME}/.zprezto/init.zsh"
fi

# Customize to your needs...
export EDITOR=vim

# golang
export GOPATH="$HOME"
export PATH=$PATH:$GOPATH/bin

# git tools
alias gclean="git branch | egrep -v '(^\*|master)' | xargs git branch -D"

# shadowenv
eval "$(shadowenv init zsh)"

# add minidev
PATH+=/opt/minidev/bin
