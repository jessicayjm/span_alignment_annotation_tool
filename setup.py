from setuptools import setup

setup(
    name='compAnn',
    version='0.1.0',
    packages=['compAnn'],
    include_package_data=True,
    install_requires=[
        'arrow',
        'bs4',
        'Flask',
        'requests',
    ],
    python_requires='>=3.6',
)
