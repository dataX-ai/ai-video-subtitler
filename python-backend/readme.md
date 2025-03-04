To install Pillow with libraqm support on a Mac, follow these steps:

1. Install Dependencies
You'll need libraqm along with its dependencies: harfbuzz, fribidi, and freetype. Use Homebrew to install them:

`brew install libraqm fribidi harfbuzz freetype`


2. Set Environment Variables
Pillow needs to find libraqm and other libraries during installation. Set these environment variables:

`export CPPFLAGS="-I$(brew --prefix freetype)/include/freetype2 -I$(brew --prefix harfbuzz)/include -I$(brew --prefix fribidi)/include -I$(brew --prefix libraqm)/include"`
`export LDFLAGS="-L$(brew --prefix freetype)/lib -L$(brew --prefix harfbuzz)/lib -L$(brew --prefix fribidi)/lib -L$(brew --prefix libraqm)/lib"`

3. Install Pillow
Now install Pillow using pip:

`pip install --no-cache-dir --upgrade --force-reinstall pillow`

4. Verify Installation
You can check if libraqm is enabled in Pillow by running:


`from PIL import features`
`print(features.check('raqm'))`
If it prints True, Pillow was successfully installed with libraqm support.

Let me know if you run into any issues! 🚀