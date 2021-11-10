# setup zsh
ln -sf ~/dotfiles/.zshrc ~/.zshrc

# setup prezto
git clone --recursive https://github.com/sorin-ionescu/prezto.git "${ZDOTDIR:-$HOME}/.zprezto"

# setup prezto
ln -sf ~/dotfiles/.zpreztorc ~/.zpreztorc
ln -sf ~/dotfiles/.zprofile ~/.zprofile

# config git
ln -sf ~/dotfiles/.gitconfig ~/.gitconfig
ln -sf ~/dotfiles/.gitignore ~/.gitignore

# chsh
chsh -s /bin/zsh
zsh
